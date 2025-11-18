#!/bin/bash

# =====================================================
# Script de Backup - Sistema de Pacientes
# =====================================================

set -e

echo "╔═══════════════════════════════════════════════════════╗"
echo "║         Backup del Sistema de Pacientes               ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "ℹ $1"
}

# Crear directorio de backups si no existe
BACKUP_DIR="./backups"
mkdir -p "$BACKUP_DIR"

# Nombre del backup con timestamp
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_FILE="$BACKUP_DIR/hospital_backup_$TIMESTAMP.sql.gz"

# Obtener credenciales del archivo .env
if [ -f ".env" ]; then
    export $(cat .env | grep -v '^#' | xargs)
fi

DB_NAME=${DB_NAME:-hospital_patients}
DB_USER=${DB_USER:-hospital_app}
DB_PASSWORD=${DB_PASSWORD:-HospitalApp123!}
MYSQL_ROOT_PASSWORD=${MYSQL_ROOT_PASSWORD:-RootPassword123!}

print_info "Creando backup de la base de datos..."

# Hacer backup usando docker exec
docker exec hospital-mysql mysqldump \
    -u root \
    -p"$MYSQL_ROOT_PASSWORD" \
    "$DB_NAME" | gzip > "$BACKUP_FILE"

# Verificar que el backup se creó
if [ -f "$BACKUP_FILE" ]; then
    BACKUP_SIZE=$(du -h "$BACKUP_FILE" | cut -f1)
    print_success "Backup creado: $BACKUP_FILE ($BACKUP_SIZE)"
else
    echo "Error: No se pudo crear el backup"
    exit 1
fi

# Limpiar backups antiguos (mantener últimos 30 días)
print_info "Limpiando backups antiguos (>30 días)..."
find "$BACKUP_DIR" -name "hospital_backup_*.sql.gz" -mtime +30 -delete 2>/dev/null || true

# Listar backups disponibles
echo ""
print_info "Backups disponibles:"
ls -lh "$BACKUP_DIR"/hospital_backup_*.sql.gz 2>/dev/null || echo "  (ninguno)"

echo ""
print_success "Proceso de backup completado"
echo ""
echo "Para restaurar este backup, usa:"
echo "  ./restore.sh $BACKUP_FILE"
echo ""
