#!/bin/bash

# =====================================================
# Script de Actualización - Sistema de Pacientes
# =====================================================

set -e

echo "╔═══════════════════════════════════════════════════════╗"
echo "║        Actualización del Sistema de Pacientes         ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Colores
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m'

print_success() {
    echo -e "${GREEN}✓${NC} $1"
}

print_info() {
    echo -e "ℹ $1"
}

# Verificar que estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    echo "Error: No se encontró docker-compose.yml"
    exit 1
fi

# Hacer backup antes de actualizar
print_info "Creando backup de seguridad..."
./backup.sh

# Detener servicios
print_info "Deteniendo servicios..."
docker compose down

# Actualizar código (si está en git)
if [ -d ".git" ]; then
    print_info "Actualizando código desde git..."
    git pull
fi

# Reconstruir imágenes
print_info "Reconstruyendo imágenes..."
docker compose build --no-cache

# Iniciar servicios
print_info "Iniciando servicios actualizados..."
docker compose up -d

# Esperar a que estén listos
sleep 10

print_success "Actualización completada"
echo ""
echo "Verifica que todo funciona en: http://localhost"
echo ""
