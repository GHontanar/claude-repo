# Guía de Instalación con Docker - Sistema de Pacientes

## Índice
1. [Instalación Rápida](#instalación-rápida)
2. [Requisitos](#requisitos)
3. [Instalación Paso a Paso](#instalación-paso-a-paso)
4. [Configuración](#configuración)
5. [Comandos Útiles](#comandos-útiles)
6. [Mantenimiento](#mantenimiento)
7. [Troubleshooting](#troubleshooting)

---

## Instalación Rápida

### Ubuntu/Linux

```bash
# 1. Clonar el repositorio (o copiar archivos al servidor)
git clone <repository-url>
cd claude-repo

# 2. Ejecutar instalador
./install.sh

# 3. Acceder a la aplicación
# Abre http://localhost en tu navegador
# Usuario: admin
# Contraseña: Hospital2024!
```

**¡Eso es todo!** El script instalará Docker si es necesario y levantará toda la aplicación.

---

## Requisitos

### Hardware Mínimo
- **CPU**: 2 cores
- **RAM**: 4 GB
- **Disco**: 20 GB libres

### Software
- **Sistema Operativo**: Ubuntu 20.04+ (o cualquier distro Linux moderna)
- **Docker**: 20.10+ (el instalador puede instalarlo automáticamente)
- **Docker Compose**: v2.0+ (incluido con Docker)

---

## Instalación Paso a Paso

### 1. Preparar el Servidor

```bash
# Actualizar sistema
sudo apt update
sudo apt upgrade -y

# Instalar herramientas básicas
sudo apt install -y git curl wget
```

### 2. Obtener el Código

**Opción A: Con Git**
```bash
git clone <repository-url>
cd claude-repo
```

**Opción B: Sin Git (archivo comprimido)**
```bash
# Copiar el archivo .tar.gz al servidor
scp hospital-app.tar.gz usuario@servidor:/home/usuario/

# En el servidor
tar -xzf hospital-app.tar.gz
cd claude-repo
```

### 3. Ejecutar Instalador

```bash
./install.sh
```

El instalador:
1. ✅ Verifica Docker (instala si es necesario)
2. ✅ Crea archivo de configuración (.env)
3. ✅ Pregunta si quieres datos de ejemplo
4. ✅ Construye las imágenes Docker
5. ✅ Inicia todos los servicios
6. ✅ Verifica que todo funciona

### 4. Acceder a la Aplicación

Abre tu navegador en: **http://localhost** (o http://IP-DEL-SERVIDOR)

**Credenciales por defecto:**
- Usuario: `admin`
- Contraseña: `Hospital2024!`

---

## Configuración

### Archivo .env

El instalador crea automáticamente un archivo `.env` con valores por defecto:

```bash
# Puerto de la aplicación
APP_PORT=80

# Configuración MySQL
MYSQL_ROOT_PASSWORD=RootPassword123!
DB_NAME=hospital_patients
DB_USER=hospital_app
DB_PASSWORD=HospitalApp123!

# JWT Secret
JWT_SECRET=<generado-automáticamente>
```

### ⚠️ IMPORTANTE - Cambiar en Producción

**Antes de usar en producción:**

1. **Editar el archivo .env:**
   ```bash
   nano .env
   ```

2. **Cambiar todas las contraseñas:**
   - `MYSQL_ROOT_PASSWORD`
   - `DB_PASSWORD`
   - `JWT_SECRET` (ya está generado, pero puedes cambiarlo)

3. **Reiniciar servicios:**
   ```bash
   docker compose down
   docker compose up -d
   ```

### Cambiar Puerto de la Aplicación

Por defecto la app corre en el puerto 80. Para cambiarlo:

```bash
# Editar .env
nano .env

# Cambiar APP_PORT
APP_PORT=8080

# Reiniciar
docker compose down
docker compose up -d
```

Ahora accede en: http://localhost:8080

---

## Comandos Útiles

### Gestión de Servicios

```bash
# Ver servicios corriendo
docker compose ps

# Ver logs en tiempo real
docker compose logs -f

# Ver logs de un servicio específico
docker compose logs -f backend
docker compose logs -f frontend
docker compose logs -f mysql

# Detener servicios (mantiene datos)
docker compose stop

# Iniciar servicios detenidos
docker compose start

# Reiniciar servicios
docker compose restart

# Apagar y eliminar contenedores (mantiene datos)
docker compose down

# Iniciar todo de nuevo
docker compose up -d
```

### Mantenimiento

```bash
# Crear backup de la base de datos
./backup.sh

# Restaurar desde un backup
./restore.sh ./backups/hospital_backup_20241118_120000.sql.gz

# Actualizar la aplicación
./update.sh

# Ver espacio usado
docker system df

# Limpiar imágenes antiguas (liberar espacio)
docker system prune -a
```

### Acceder a los Contenedores

```bash
# Acceder a MySQL
docker exec -it hospital-mysql mysql -u root -p

# Acceder al backend (Node.js)
docker exec -it hospital-backend sh

# Ver archivos del frontend
docker exec -it hospital-frontend sh
```

### Verificar Estado de Salud

```bash
# Health check de todos los servicios
docker compose ps

# Revisar logs de errores
docker compose logs --tail=50 backend
docker compose logs --tail=50 mysql
```

---

## Mantenimiento

### Backups Automáticos

**Configurar backup diario con cron:**

```bash
# Editar crontab
crontab -e

# Añadir línea (backup diario a las 2 AM)
0 2 * * * cd /ruta/a/claude-repo && ./backup.sh >> /var/log/hospital-backup.log 2>&1
```

Los backups se guardan en `./backups/` y se eliminan automáticamente después de 30 días.

### Actualizar la Aplicación

Cuando haya una nueva versión:

```bash
# El script hace backup automático antes de actualizar
./update.sh
```

### Monitoreo

**Ver uso de recursos:**
```bash
docker stats
```

**Ver espacio en disco:**
```bash
df -h
du -sh ./backups/
docker system df
```

---

## Arquitectura Docker

### Servicios

El `docker-compose.yml` define 3 servicios:

1. **mysql** (Puerto 3306)
   - Base de datos MySQL 8.0
   - Volumen persistente: `mysql_data`
   - Scripts de inicialización automática

2. **backend** (Puerto interno 3000)
   - API Node.js/Express
   - Se conecta a MySQL
   - Health checks cada 30s

3. **frontend** (Puerto 80)
   - Nginx sirviendo React build
   - Proxy reverso a backend (/api → backend:3000)
   - Archivos estáticos con cache

### Red

Todos los servicios están en la red `hospital-network`:
- Frontend puede comunicarse con Backend
- Backend puede comunicarse con MySQL
- Solo el frontend está expuesto al exterior (puerto 80)

### Volúmenes

- **mysql_data**: Datos persistentes de MySQL
  - Ubicación: `/var/lib/docker/volumes/`
  - Se mantiene aunque borres los contenedores

### Health Checks

Cada servicio tiene health checks:
- **MySQL**: Ping cada 10s
- **Backend**: HTTP GET /api/health cada 30s
- **Frontend**: HTTP GET / cada 30s

---

## Troubleshooting

### La aplicación no inicia

**1. Verificar que Docker está corriendo:**
```bash
sudo systemctl status docker

# Si no está corriendo
sudo systemctl start docker
```

**2. Ver logs de errores:**
```bash
docker compose logs
```

**3. Verificar puertos:**
```bash
# Ver si el puerto 80 está ocupado
sudo netstat -tulpn | grep :80

# Si está ocupado, cambiar APP_PORT en .env
```

### "Cannot connect to MySQL"

**1. Esperar a que MySQL esté listo:**
```bash
# MySQL tarda ~30 segundos en iniciar la primera vez
docker compose logs mysql

# Buscar: "ready for connections"
```

**2. Verificar credenciales en .env**

**3. Reiniciar servicios:**
```bash
docker compose restart
```

### "Port 80 already in use"

```bash
# Ver qué está usando el puerto
sudo lsof -i :80

# Opciones:
# 1. Detener el servicio que lo usa
# 2. Cambiar APP_PORT en .env a otro puerto (ej: 8080)
```

### Frontend muestra "Unable to connect to server"

**1. Verificar que backend está corriendo:**
```bash
docker compose ps

# backend debe estar "Up" y "healthy"
```

**2. Verificar logs del backend:**
```bash
docker compose logs backend
```

**3. Reiniciar:**
```bash
docker compose restart backend
```

### Olvidé la contraseña de admin

```bash
# Acceder a MySQL
docker exec -it hospital-mysql mysql -u root -p<MYSQL_ROOT_PASSWORD> hospital_patients

# Actualizar contraseña del admin (hash de "Hospital2024!")
UPDATE usuarios SET password = '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy' WHERE username = 'admin';
```

### Limpiar todo y empezar de cero

```bash
# ADVERTENCIA: Esto borra TODOS los datos

# Detener y eliminar contenedores
docker compose down

# Eliminar volumen de datos
docker volume rm claude-repo_mysql_data

# Volver a instalar
./install.sh
```

### Error de permisos en scripts

```bash
# Dar permisos de ejecución
chmod +x *.sh
```

### Ver información detallada de un contenedor

```bash
docker inspect hospital-mysql
docker inspect hospital-backend
docker inspect hospital-frontend
```

---

## Firewall

Si usas firewall, abre el puerto:

```bash
# UFW (Ubuntu)
sudo ufw allow 80/tcp

# Verificar
sudo ufw status
```

---

## Desinstalar

```bash
# Detener servicios
docker compose down

# Eliminar volúmenes (BORRA DATOS)
docker volume rm claude-repo_mysql_data

# Eliminar imágenes
docker rmi hospital-backend hospital-frontend mysql:8.0

# Eliminar archivos
cd ..
rm -rf claude-repo
```

---

## Acceso Remoto

### Desde otra máquina en la red local

```bash
# En el servidor, obtener IP
ip addr show

# Desde otra PC en la misma red
http://IP-DEL-SERVIDOR
```

### Configurar HTTPS (Producción)

Ver: [DEPLOYMENT.md](DEPLOYMENT.md) sección SSL/TLS

---

## Soporte

Para más información:
- **Arquitectura**: [ARCHITECTURE.md](ARCHITECTURE.md)
- **API**: [API_DOCUMENTATION.md](API_DOCUMENTATION.md)
- **Base de Datos**: [DATABASE_SCHEMA.md](DATABASE_SCHEMA.md)
- **Desarrollo**: [DEVELOPMENT.md](DEVELOPMENT.md)
- **Despliegue**: [DEPLOYMENT.md](DEPLOYMENT.md)

---

## Resumen de Comandos Principales

```bash
# Instalación inicial
./install.sh

# Backup
./backup.sh

# Restaurar
./restore.sh <archivo>

# Actualizar
./update.sh

# Ver logs
docker compose logs -f

# Reiniciar todo
docker compose restart

# Detener todo
docker compose down

# Iniciar todo
docker compose up -d
```

¡Eso es todo! Docker hace que la instalación y el mantenimiento sean muy sencillos.
