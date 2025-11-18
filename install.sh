#!/bin/bash

# =====================================================
# Instalador para Sistema de Seguimiento de Pacientes
# =====================================================

set -e  # Salir si hay algún error

echo "╔═══════════════════════════════════════════════════════╗"
echo "║   Sistema de Seguimiento de Pacientes - Instalador   ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# Función para imprimir mensajes
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

# Verificar si estamos en el directorio correcto
if [ ! -f "docker-compose.yml" ]; then
    print_error "No se encontró docker-compose.yml. Ejecuta este script desde el directorio raíz del proyecto."
    exit 1
fi

# Verificar si Docker está instalado
echo "Verificando Docker..."
if ! command -v docker &> /dev/null; then
    print_warning "Docker no está instalado."
    echo ""
    echo "¿Desea instalar Docker ahora? (s/n)"
    read -r install_docker

    if [ "$install_docker" = "s" ] || [ "$install_docker" = "S" ]; then
        print_info "Instalando Docker..."

        # Actualizar repositorios
        sudo apt-get update

        # Instalar dependencias
        sudo apt-get install -y \
            ca-certificates \
            curl \
            gnupg \
            lsb-release

        # Añadir GPG key oficial de Docker
        sudo mkdir -p /etc/apt/keyrings
        curl -fsSL https://download.docker.com/linux/ubuntu/gpg | sudo gpg --dearmor -o /etc/apt/keyrings/docker.gpg

        # Configurar repositorio
        echo \
          "deb [arch=$(dpkg --print-architecture) signed-by=/etc/apt/keyrings/docker.gpg] https://download.docker.com/linux/ubuntu \
          $(lsb_release -cs) stable" | sudo tee /etc/apt/sources.list.d/docker.list > /dev/null

        # Instalar Docker
        sudo apt-get update
        sudo apt-get install -y docker-ce docker-ce-cli containerd.io docker-compose-plugin

        # Añadir usuario actual al grupo docker
        sudo usermod -aG docker $USER

        print_success "Docker instalado correctamente"
        print_warning "IMPORTANTE: Cierra esta terminal y abre una nueva para que los cambios surtan efecto."
        print_warning "Luego ejecuta este script de nuevo."
        exit 0
    else
        print_error "Docker es necesario para continuar. Instalación cancelada."
        exit 1
    fi
else
    print_success "Docker está instalado"
fi

# Verificar si Docker Compose está disponible
echo "Verificando Docker Compose..."
if ! docker compose version &> /dev/null; then
    print_error "Docker Compose no está disponible"
    exit 1
fi
print_success "Docker Compose está disponible"

# Crear archivo .env si no existe
if [ ! -f ".env" ]; then
    print_info "Creando archivo de configuración .env..."
    cp .env.example .env

    # Generar JWT_SECRET aleatorio
    if command -v openssl &> /dev/null; then
        JWT_SECRET=$(openssl rand -hex 64)
        sed -i "s|JWT_SECRET=.*|JWT_SECRET=${JWT_SECRET}|" .env
        print_success "JWT_SECRET generado automáticamente"
    fi

    print_success "Archivo .env creado"
    print_warning "IMPORTANTE: Revisa y modifica las contraseñas en el archivo .env antes de usar en producción"
else
    print_info "El archivo .env ya existe, usando configuración existente"
fi

# Preguntar si quiere datos de ejemplo
echo ""
echo "¿Desea cargar datos de ejemplo? (s/n)"
read -r load_seed

if [ "$load_seed" = "n" ] || [ "$load_seed" = "N" ]; then
    # Renombrar seed.sql para que no se ejecute
    if [ -f "sql/seed.sql" ]; then
        mv sql/seed.sql sql/seed.sql.disabled
        print_info "Datos de ejemplo deshabilitados"
    fi
else
    # Asegurarse de que seed.sql está habilitado
    if [ -f "sql/seed.sql.disabled" ]; then
        mv sql/seed.sql.disabled sql/seed.sql
    fi
    print_info "Se cargarán datos de ejemplo"
fi

# Detener contenedores existentes si los hay
echo ""
print_info "Deteniendo contenedores existentes (si los hay)..."
docker compose down 2>/dev/null || true

# Construir imágenes
echo ""
print_info "Construyendo imágenes Docker (esto puede tomar unos minutos)..."
docker compose build

# Iniciar servicios
echo ""
print_info "Iniciando servicios..."
docker compose up -d

# Esperar a que los servicios estén listos
echo ""
print_info "Esperando a que los servicios estén listos..."
sleep 10

# Verificar estado de los contenedores
echo ""
print_info "Verificando estado de los servicios..."

if docker ps | grep -q hospital-mysql; then
    print_success "MySQL: OK"
else
    print_error "MySQL: ERROR"
fi

if docker ps | grep -q hospital-backend; then
    print_success "Backend: OK"
else
    print_error "Backend: ERROR"
fi

if docker ps | grep -q hospital-frontend; then
    print_success "Frontend: OK"
else
    print_error "Frontend: ERROR"
fi

# Obtener puerto de la aplicación
APP_PORT=$(grep APP_PORT .env | cut -d '=' -f2)
APP_PORT=${APP_PORT:-80}

# Información final
echo ""
echo "╔═══════════════════════════════════════════════════════╗"
echo "║              ¡Instalación Completada!                 ║"
echo "╚═══════════════════════════════════════════════════════╝"
echo ""
print_success "La aplicación está corriendo"
echo ""
echo "Accede a la aplicación en:"
echo "  → http://localhost:$APP_PORT"
echo ""
echo "Credenciales por defecto:"
echo "  Usuario: admin"
echo "  Contraseña: Hospital2024!"
echo ""
echo "Comandos útiles:"
echo "  Ver logs:      docker compose logs -f"
echo "  Detener:       docker compose stop"
echo "  Reiniciar:     docker compose restart"
echo "  Apagar todo:   docker compose down"
echo "  Actualizar:    ./update.sh"
echo "  Backup:        ./backup.sh"
echo ""
print_warning "IMPORTANTE: Cambia las contraseñas por defecto en el archivo .env"
echo ""
