#!/bin/bash

# =====================================================
# Script de Restauración - Sistema de Pacientes
# =====================================================

set -e

echo "╔═══════════════════════════════════════════════════════╗"
echo "║       Restauración del Sistema de Pacientes           ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_error() {
    echo -e "${RED}✗${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}⚠${NC} $1"
}

print_info() {
    echo -e "ℹ $1"
}

# Verificar argumento
if [ -z "$1" ]; then
    print_error "Uso: ./restore.sh <archivo_backup.sql.gz>"
    echo ""
    echo "Backups disponibles:"
    ls -lh ./backups/hospital_backup_*.sql.gz 2>/dev/null || echo "  (ninguno)"
    exit 1
fi

BACKUP_FILE="$1"

# Verificar que el archivo existe
if [ ! -f "$BACKUP_FILE" ]; then
    print_error "El archivo $BACKUP_FILE no existe"
    exit 1
fi

# Obtener credenciales del archivo .env
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

DB_NAME=${DB_NAME:-hospital_patients}
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-RootPassword123!}

# Advertencia
print_warning "ADVERTENCIA: Esta operación sobrescribirá todos los datos actuales"
echo "Archivo a restaurar: $BACKUP_FILE"
echo ""
echo "¿Estás seguro de continuar? (escribe 'SI' para confirmar)"
read -r confirmation

if [ "$confirmation" != "SI" ]; then
    print_info "Restauración cancelada"
    exit 0
fi

# Crear backup de seguridad antes de restaurar
print_info "Creando backup de seguridad de los datos actuales..."
./backup.sh

# Restaurar base de datos
print_info "Restaurando base de datos desde $BACKUP_FILE..."

gunzip < "$BACKUP_FILE" | docker exec -i hospital-mysql mysql \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" \
    "$DB_NAME"

print_success "Base de datos restaurada correctamente"

# Reiniciar servicios
print_info "Reiniciando servicios..."
docker compose restart

sleep 5

print_success "Restauración completada"
echo ""
echo "La aplicación está disponible en: http://localhost"
echo ""
