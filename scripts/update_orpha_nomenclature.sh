#!/bin/bash

###############################################################################
# Script de Actualización Anual de Nomenclatura ORPHA
#
# Descripción:
#   Descarga la última versión de la nomenclatura Orphanet y actualiza la BD
#
# Uso:
#   ./scripts/update_orpha_nomenclature.sh
#
# Frecuencia:
#   Ejecutar 1-2 veces al año (Orphanet actualiza en Julio y Diciembre)
#
# Requisitos:
#   - Node.js instalado
#   - Docker/Docker Compose para acceso a MySQL
#   - Variables de entorno configuradas (.env)
#
# Autor: Hospital - Sistema de Pacientes
# Última actualización: 2024-11-19
###############################################################################

set -e  # Salir si hay error

# =====================================================
# CONFIGURACIÓN
# =====================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
BACKUP_DIR="${PROJECT_ROOT}/backups"
BACKUP_FILE="${BACKUP_DIR}/orpha_nomenclatura_$(date +%Y%m%d_%H%M%S).sql"

# Colores para output
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
RED='\033[0;31m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# =====================================================
# FUNCIONES
# =====================================================

print_header() {
  echo ""
  echo "========================================="
  echo "  $1"
  echo "========================================="
  echo ""
}

print_success() {
  echo -e "${GREEN}✅ $1${NC}"
}

print_warning() {
  echo -e "${YELLOW}⚠️  $1${NC}"
}

print_error() {
  echo -e "${RED}❌ $1${NC}"
}

print_info() {
  echo -e "${BLUE}ℹ️  $1${NC}"
}

# =====================================================
# VALIDACIONES PREVIAS
# =====================================================

validate_prerequisites() {
  print_info "Validando requisitos previos..."

  # Verificar que estamos en el directorio correcto
  if [ ! -f "${PROJECT_ROOT}/backend/package.json" ]; then
    print_error "Error: Ejecuta este script desde la raíz del proyecto"
    echo "  Ruta actual: $(pwd)"
    echo "  Ruta esperada: ${PROJECT_ROOT}"
    exit 1
  fi

  # Verificar Node.js
  if ! command -v node &> /dev/null; then
    print_error "Node.js no está instalado"
    echo "  Instalar desde: https://nodejs.org/"
    exit 1
  fi

  local node_version=$(node -v | cut -d'v' -f2 | cut -d'.' -f1)
  if [ "$node_version" -lt 18 ]; then
    print_error "Node.js versión 18+ requerida (actual: $(node -v))"
    exit 1
  fi

  # Verificar Docker o acceso a MySQL
  if ! command -v docker &> /dev/null; then
    print_warning "Docker no está disponible"
    print_info "Asumiendo acceso directo a MySQL..."
  fi

  # Verificar archivo .env
  if [ ! -f "${PROJECT_ROOT}/backend/.env" ]; then
    print_error "Archivo .env no encontrado en backend/"
    exit 1
  fi

  print_success "Requisitos validados"
}

# =====================================================
# BACKUP
# =====================================================

create_backup() {
  print_info "Creando backup de nomenclatura actual..."

  # Crear directorio de backups si no existe
  mkdir -p "${BACKUP_DIR}"

  # Cargar variables de entorno
  source "${PROJECT_ROOT}/backend/.env"

  # Determinar comando de backup según disponibilidad de Docker
  if command -v docker &> /dev/null && docker compose ps mysql &> /dev/null; then
    # Usar Docker Compose
    print_info "Usando Docker Compose para backup..."
    docker compose exec -T mysql mysqldump \
      -u"${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" \
      orpha_nomenclatura > "${BACKUP_FILE}"
  elif command -v mysqldump &> /dev/null; then
    # Usar mysqldump local
    print_info "Usando mysqldump local..."
    mysqldump -h"${DB_HOST}" -u"${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" \
      orpha_nomenclatura > "${BACKUP_FILE}"
  else
    print_warning "No se pudo crear backup (mysqldump no disponible)"
    read -p "¿Continuar sin backup? (s/N): " -n 1 -r
    echo
    if [[ ! $REPLY =~ ^[SsYy]$ ]]; then
      print_info "Actualización cancelada"
      exit 0
    fi
    BACKUP_FILE=""
  fi

  if [ -n "${BACKUP_FILE}" ] && [ -f "${BACKUP_FILE}" ]; then
    local backup_size=$(du -h "${BACKUP_FILE}" | cut -f1)
    print_success "Backup creado: ${BACKUP_FILE} (${backup_size})"
  fi
}

# =====================================================
# IMPORTACIÓN
# =====================================================

run_import() {
  print_info "Descargando última versión desde Orphacode..."

  cd "${PROJECT_ROOT}/backend"

  # Instalar dependencias si es necesario
  if [ ! -d "node_modules" ] || [ ! -d "node_modules/axios" ] || [ ! -d "node_modules/xml2js" ]; then
    print_info "Instalando dependencias de Node.js..."
    npm install
  fi

  # Ejecutar script de importación
  print_info "Ejecutando script de importación..."
  echo ""

  if node scripts/import_orpha_nomenclature.js; then
    print_success "Importación completada exitosamente"
    return 0
  else
    print_error "Error en la importación"
    return 1
  fi
}

# =====================================================
# VERIFICACIÓN
# =====================================================

verify_import() {
  print_info "Verificando importación..."

  source "${PROJECT_ROOT}/backend/.env"

  # Query de verificación
  local verify_query="SELECT COUNT(*) as total FROM orpha_nomenclatura"

  local total_count=""
  if command -v docker &> /dev/null && docker compose ps mysql &> /dev/null; then
    total_count=$(docker compose exec -T mysql mysql \
      -u"${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" \
      -se "${verify_query}" 2>/dev/null | tail -1)
  elif command -v mysql &> /dev/null; then
    total_count=$(mysql -h"${DB_HOST}" -u"${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" \
      -se "${verify_query}" 2>/dev/null | tail -1)
  fi

  if [ -n "${total_count}" ] && [ "${total_count}" -gt 0 ]; then
    print_success "Verificación exitosa: ${total_count} nomenclaturas en BD"
    return 0
  else
    print_error "Verificación falló: No se encontraron nomenclaturas"
    return 1
  fi
}

# =====================================================
# ROLLBACK
# =====================================================

rollback() {
  if [ -z "${BACKUP_FILE}" ] || [ ! -f "${BACKUP_FILE}" ]; then
    print_error "No hay backup disponible para rollback"
    return 1
  fi

  print_warning "Restaurando backup..."

  source "${PROJECT_ROOT}/backend/.env"

  if command -v docker &> /dev/null && docker compose ps mysql &> /dev/null; then
    docker compose exec -T mysql mysql \
      -u"${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" \
      < "${BACKUP_FILE}"
  elif command -v mysql &> /dev/null; then
    mysql -h"${DB_HOST}" -u"${DB_USER}" -p"${DB_PASSWORD}" "${DB_NAME}" \
      < "${BACKUP_FILE}"
  else
    print_error "No se puede restaurar backup (mysql no disponible)"
    return 1
  fi

  print_success "Backup restaurado exitosamente"
}

# =====================================================
# LIMPIEZA DE BACKUPS ANTIGUOS
# =====================================================

cleanup_old_backups() {
  print_info "Limpiando backups antiguos (manteniendo últimos 5)..."

  cd "${BACKUP_DIR}"
  ls -t orpha_nomenclatura_*.sql 2>/dev/null | tail -n +6 | xargs -r rm --

  local backup_count=$(ls -1 orpha_nomenclatura_*.sql 2>/dev/null | wc -l)
  print_success "Backups actuales: ${backup_count}"
}

# =====================================================
# FUNCIÓN PRINCIPAL
# =====================================================

main() {
  print_header "Actualización Nomenclatura ORPHA"

  # 1. Validar requisitos
  validate_prerequisites

  # 2. Crear backup
  create_backup

  # 3. Ejecutar importación
  if run_import; then
    # 4. Verificar importación
    if verify_import; then
      # 5. Limpiar backups antiguos
      cleanup_old_backups

      # Éxito
      print_header "✅ Actualización Completada"
      echo "📝 Próximos pasos:"
      echo "  1. Verifica la app: http://localhost"
      echo "  2. Comprueba que las búsquedas funcionan correctamente"
      echo "  3. Prueba el autocomplete de diagnósticos"
      echo ""
      if [ -n "${BACKUP_FILE}" ]; then
        echo "💾 Backup disponible en: ${BACKUP_FILE}"
        echo "   (Restaurar si hay problemas con: cat ${BACKUP_FILE} | docker compose exec -T mysql mysql -u\${DB_USER} -p\${DB_PASSWORD} \${DB_NAME})"
      fi
      echo ""
      exit 0
    else
      # Verificación falló - Rollback
      print_error "Verificación falló"

      if [ -n "${BACKUP_FILE}" ]; then
        read -p "¿Restaurar backup automáticamente? (S/n): " -n 1 -r
        echo
        if [[ $REPLY =~ ^[SsYy]$ ]] || [[ -z $REPLY ]]; then
          if rollback; then
            print_header "⚠️  Actualización Revertida"
            echo "La base de datos fue restaurada al estado anterior"
            exit 1
          fi
        fi
      fi

      print_header "❌ Actualización Falló"
      echo "La verificación falló pero la importación se completó"
      echo "Revisa los logs y verifica manualmente"
      exit 1
    fi
  else
    # Importación falló - Rollback automático
    print_error "Importación falló"

    if [ -n "${BACKUP_FILE}" ]; then
      print_info "Restaurando backup automáticamente..."
      if rollback; then
        print_header "⚠️  Actualización Revertida"
        echo "La base de datos fue restaurada al estado anterior"
        exit 1
      else
        print_header "❌ ERROR CRÍTICO"
        echo "La importación falló Y el rollback también falló"
        echo "Restaura manualmente el backup:"
        echo "  cat ${BACKUP_FILE} | docker compose exec -T mysql mysql -u\${DB_USER} -p\${DB_PASSWORD} \${DB_NAME}"
        exit 2
      fi
    else
      print_header "❌ Actualización Falló"
      echo "No hay backup disponible"
      exit 1
    fi
  fi
}

# =====================================================
# MANEJO DE SEÑALES (Ctrl+C)
# =====================================================

trap 'echo ""; print_error "Actualización interrumpida por usuario"; exit 130' INT TERM

# =====================================================
# EJECUTAR
# =====================================================

main "$@"
