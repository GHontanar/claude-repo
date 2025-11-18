# Deployment Guide - Patient Tracking System

## Índice
1. [Requisitos del Servidor](#requisitos-del-servidor)
2. [Preparación del Entorno](#preparación-del-entorno)
3. [Instalación en Producción](#instalación-en-producción)
4. [Configuración de Seguridad](#configuración-de-seguridad)
5. [Monitoreo y Mantenimiento](#monitoreo-y-mantenimiento)
6. [Troubleshooting](#troubleshooting)

---

## Requisitos del Servidor

### Hardware Mínimo

| Componente | Mínimo | Recomendado |
|------------|--------|-------------|
| CPU | 2 cores | 4 cores |
| RAM | 4 GB | 8 GB |
| Disco | 50 GB SSD | 100 GB SSD |
| Red | 100 Mbps | 1 Gbps |

**Estimación de capacidad:**
- Hasta 10,000 pacientes
- 5-10 usuarios concurrentes
- ~1GB de datos de pacientes

### Software Requerido

- **Sistema Operativo**: Ubuntu Server 22.04 LTS (recomendado) o similar
- **Node.js**: v18.x LTS
- **MySQL**: v8.0
- **Nginx**: Latest stable (para servir frontend y proxy reverso)
- **PM2**: Para gestión de procesos Node.js
- **Certbot**: Para certificados SSL (opcional pero recomendado)

---

## Preparación del Entorno

### 1. Actualizar Sistema

```bash
sudo apt update
sudo apt upgrade -y
```

### 2. Instalar Node.js

```bash
# Instalar Node.js 18.x
curl -fsSL https://deb.nodesource.com/setup_18.x | sudo -E bash -
sudo apt install -y nodejs

# Verificar instalación
node --version  # v18.x.x
npm --version   # v9.x.x
```

### 3. Instalar MySQL

```bash
# Instalar MySQL Server
sudo apt install -y mysql-server

# Asegurar instalación
sudo mysql_secure_installation

# Responder a las preguntas:
# - Set root password: YES (usar contraseña fuerte)
# - Remove anonymous users: YES
# - Disallow root login remotely: YES
# - Remove test database: YES
# - Reload privilege tables: YES
```

### 4. Instalar Nginx

```bash
sudo apt install -y nginx

# Verificar que está corriendo
sudo systemctl status nginx

# Habilitar para inicio automático
sudo systemctl enable nginx
```

### 5. Instalar PM2

```bash
# Instalar PM2 globalmente
sudo npm install -g pm2

# Configurar inicio automático
pm2 startup
# Ejecutar el comando que PM2 muestra
```

---

## Instalación en Producción

### 1. Crear Usuario del Sistema

```bash
# Crear usuario dedicado (buena práctica de seguridad)
sudo useradd -m -s /bin/bash hospital_app
sudo passwd hospital_app

# Cambiar a ese usuario
sudo su - hospital_app
```

### 2. Clonar Repositorio

```bash
cd /home/hospital_app
git clone git@github.com:GHontanar/claude-repo.git
cd claude-repo
```

### 3. Configurar Base de Datos

```bash
# Acceder a MySQL como root
sudo mysql -u root -p

# Ejecutar configuración
```

```sql
-- Crear base de datos
CREATE DATABASE hospital_patients
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

-- Crear usuario de aplicación (NO usar root)
CREATE USER 'hospital_app'@'localhost' IDENTIFIED BY 'PASSWORD_SEGURO_AQUI';

-- Dar permisos solo a esta base de datos
GRANT SELECT, INSERT, UPDATE, DELETE ON hospital_patients.* TO 'hospital_app'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;
EXIT;
```

```bash
# Importar schema
mysql -u hospital_app -p hospital_patients < sql/schema.sql

# Verificar que se creó correctamente
mysql -u hospital_app -p -e "USE hospital_patients; SHOW TABLES;"
```

### 4. Configurar Backend

```bash
cd backend

# Instalar dependencias (solo producción)
npm ci --production

# Crear archivo .env
nano .env
```

**Contenido de `.env` para producción:**
```bash
# Database
DB_HOST=localhost
DB_USER=hospital_app
DB_PASSWORD=PASSWORD_SEGURO_AQUI
DB_NAME=hospital_patients

# JWT - GENERAR NUEVO SECRET ALEATORIO
JWT_SECRET=REEMPLAZAR_CON_SECRET_LARGO_Y_ALEATORIO

# Server
PORT=3000
NODE_ENV=production

# CORS - Ajustar según dominio
FRONTEND_URL=https://hospital.local

# Logs
LOG_LEVEL=error
```

**Generar JWT_SECRET:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

**Asegurar permisos del .env:**
```bash
chmod 600 .env
```

### 5. Configurar Frontend

```bash
cd ../frontend

# Instalar dependencias
npm ci

# Crear .env para build
nano .env.production
```

**Contenido de `.env.production`:**
```bash
# URL del backend (ajustar según configuración)
VITE_API_URL=https://hospital.local/api
```

```bash
# Build para producción
npm run build

# Se crea carpeta 'dist' con archivos estáticos
```

### 6. Configurar Nginx

```bash
# Crear configuración del sitio
sudo nano /etc/nginx/sites-available/hospital_app
```

**Contenido del archivo:**
```nginx
# Frontend y proxy reverso para backend
server {
    listen 80;
    server_name hospital.local;  # Cambiar por tu dominio/IP

    # Logs
    access_log /var/log/nginx/hospital_access.log;
    error_log /var/log/nginx/hospital_error.log;

    # Frontend estático (React build)
    location / {
        root /home/hospital_app/claude-repo/frontend/dist;
        try_files $uri $uri/ /index.html;

        # Headers de seguridad
        add_header X-Frame-Options "SAMEORIGIN" always;
        add_header X-Content-Type-Options "nosniff" always;
        add_header X-XSS-Protection "1; mode=block" always;
    }

    # Proxy reverso para backend API
    location /api {
        proxy_pass http://localhost:3000;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
        proxy_cache_bypass $http_upgrade;

        # Timeouts
        proxy_connect_timeout 60s;
        proxy_send_timeout 60s;
        proxy_read_timeout 60s;

        # Tamaño máximo de archivo (para importación)
        client_max_body_size 10M;
    }

    # Cache para assets estáticos
    location ~* \.(js|css|png|jpg|jpeg|gif|ico|svg|woff|woff2|ttf|eot)$ {
        root /home/hospital_app/claude-repo/frontend/dist;
        expires 1y;
        add_header Cache-Control "public, immutable";
    }
}
```

```bash
# Habilitar sitio
sudo ln -s /etc/nginx/sites-available/hospital_app /etc/nginx/sites-enabled/

# Eliminar sitio default (opcional)
sudo rm /etc/nginx/sites-enabled/default

# Verificar configuración
sudo nginx -t

# Recargar Nginx
sudo systemctl reload nginx
```

### 7. Iniciar Backend con PM2

```bash
cd /home/hospital_app/claude-repo/backend

# Iniciar aplicación
pm2 start server.js --name hospital-api

# Verificar que está corriendo
pm2 status

# Ver logs
pm2 logs hospital-api

# Guardar configuración para reinicio automático
pm2 save

# Configurar inicio automático del sistema
pm2 startup
# Ejecutar el comando que PM2 muestra
```

**Configuración avanzada con ecosystem file:**
```bash
# Crear ecosystem.config.js
nano ecosystem.config.js
```

```javascript
module.exports = {
  apps: [{
    name: 'hospital-api',
    script: './server.js',
    instances: 2,  // Número de instancias (cluster mode)
    exec_mode: 'cluster',
    env: {
      NODE_ENV: 'production',
      PORT: 3000
    },
    error_file: '/home/hospital_app/logs/err.log',
    out_file: '/home/hospital_app/logs/out.log',
    log_date_format: 'YYYY-MM-DD HH:mm:ss Z',
    max_memory_restart: '500M',
    autorestart: true,
    watch: false
  }]
};
```

```bash
# Iniciar con ecosystem
pm2 start ecosystem.config.js
pm2 save
```

---

## Configuración de Seguridad

### 1. Firewall (UFW)

```bash
# Habilitar UFW
sudo ufw enable

# Permitir SSH
sudo ufw allow ssh

# Permitir HTTP/HTTPS
sudo ufw allow 80/tcp
sudo ufw allow 443/tcp

# Verificar reglas
sudo ufw status
```

### 2. SSL/TLS con Let's Encrypt (Recomendado)

```bash
# Instalar Certbot
sudo apt install -y certbot python3-certbot-nginx

# Obtener certificado (reemplazar con tu dominio)
sudo certbot --nginx -d hospital.local

# Certbot configurará automáticamente Nginx para HTTPS
# Los certificados se renovarán automáticamente
```

**Verificar renovación automática:**
```bash
sudo certbot renew --dry-run
```

### 3. Configuración MySQL Segura

```bash
# Editar configuración
sudo nano /etc/mysql/mysql.conf.d/mysqld.cnf
```

```ini
[mysqld]
# Solo escuchar en localhost (no permitir conexiones remotas)
bind-address = 127.0.0.1

# Logs de seguridad
log_error = /var/log/mysql/error.log

# Límite de conexiones
max_connections = 50
```

```bash
# Reiniciar MySQL
sudo systemctl restart mysql
```

### 4. Permisos de Archivos

```bash
# Asegurar permisos correctos
cd /home/hospital_app/claude-repo

# .env solo lectura para el usuario
chmod 600 backend/.env

# Carpetas de logs
mkdir -p /home/hospital_app/logs
chmod 755 /home/hospital_app/logs
```

### 5. Fail2Ban (Protección contra ataques)

```bash
# Instalar
sudo apt install -y fail2ban

# Copiar configuración
sudo cp /etc/fail2ban/jail.conf /etc/fail2ban/jail.local

# Editar
sudo nano /etc/fail2ban/jail.local
```

```ini
[nginx-limit-req]
enabled = true
filter = nginx-limit-req
logpath = /var/log/nginx/hospital_error.log
```

```bash
# Reiniciar
sudo systemctl restart fail2ban

# Verificar
sudo fail2ban-client status
```

---

## Configuración de Hosts (Interno)

Si el servidor está en red interna del hospital sin DNS:

### En el Servidor

```bash
sudo nano /etc/hosts
```

```
127.0.0.1 hospital.local
```

### En Máquinas Cliente

**Windows:**
- Editar `C:\Windows\System32\drivers\etc\hosts` (como Administrador)

**Linux/Mac:**
```bash
sudo nano /etc/hosts
```

Añadir:
```
192.168.1.100  hospital.local  # Reemplazar con IP del servidor
```

---

## Monitoreo y Mantenimiento

### 1. Logs

**Nginx:**
```bash
# Ver logs en tiempo real
sudo tail -f /var/log/nginx/hospital_access.log
sudo tail -f /var/log/nginx/hospital_error.log
```

**Backend (PM2):**
```bash
# Ver logs
pm2 logs hospital-api

# Logs guardados en archivo
tail -f /home/hospital_app/logs/out.log
tail -f /home/hospital_app/logs/err.log
```

**MySQL:**
```bash
sudo tail -f /var/log/mysql/error.log
```

### 2. Monitoreo de PM2

```bash
# Dashboard en tiempo real
pm2 monit

# Información detallada
pm2 show hospital-api

# Uso de recursos
pm2 list
```

### 3. Backup Automatizado

```bash
# Crear directorio de backups
sudo mkdir -p /backups/hospital_patients
sudo chown hospital_app:hospital_app /backups/hospital_patients
```

**Script de backup:**
```bash
nano /home/hospital_app/backup.sh
```

```bash
#!/bin/bash
# Backup script para hospital_patients

DATE=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="/backups/hospital_patients"
DB_NAME="hospital_patients"
DB_USER="hospital_app"
DB_PASS="PASSWORD_AQUI"  # Mejor usar .my.cnf

# Crear backup
mysqldump -u$DB_USER -p$DB_PASS $DB_NAME | gzip > $BACKUP_DIR/backup_$DATE.sql.gz

# Mantener solo últimos 30 días
find $BACKUP_DIR -name "backup_*.sql.gz" -mtime +30 -delete

# Log
echo "$(date): Backup completado - backup_$DATE.sql.gz" >> $BACKUP_DIR/backup.log
```

```bash
# Dar permisos de ejecución
chmod +x /home/hospital_app/backup.sh

# Programar con cron (diario a las 2 AM)
crontab -e
```

```cron
0 2 * * * /home/hospital_app/backup.sh
```

### 4. Actualizaciones

**Backend:**
```bash
cd /home/hospital_app/claude-repo/backend

# Pull últimos cambios
git pull origin main

# Actualizar dependencias si hay cambios
npm ci --production

# Reiniciar aplicación
pm2 restart hospital-api
```

**Frontend:**
```bash
cd /home/hospital_app/claude-repo/frontend

# Pull últimos cambios
git pull origin main

# Rebuild
npm ci
npm run build

# Nginx servirá automáticamente la nueva versión
```

**Sistema:**
```bash
# Actualizar paquetes del sistema (mensual)
sudo apt update
sudo apt upgrade -y

# Reiniciar servicios si es necesario
sudo systemctl restart nginx
sudo systemctl restart mysql
pm2 restart all
```

---

## Health Checks

### Script de Monitoreo

```bash
nano /home/hospital_app/healthcheck.sh
```

```bash
#!/bin/bash
# Health check script

API_URL="http://localhost:3000/api/auth/me"
LOG_FILE="/home/hospital_app/logs/healthcheck.log"

# Check API
response=$(curl -s -o /dev/null -w "%{http_code}" $API_URL)

if [ $response -eq 401 ]; then
  # 401 es esperado sin token, significa que API funciona
  echo "$(date): API OK" >> $LOG_FILE
else
  echo "$(date): API ERROR - HTTP $response" >> $LOG_FILE
  # Reiniciar si hay error
  pm2 restart hospital-api
  echo "$(date): PM2 restarted" >> $LOG_FILE
fi

# Check MySQL
mysql -u hospital_app -pPASSWORD -e "SELECT 1" > /dev/null 2>&1
if [ $? -eq 0 ]; then
  echo "$(date): MySQL OK" >> $LOG_FILE
else
  echo "$(date): MySQL ERROR" >> $LOG_FILE
  sudo systemctl restart mysql
fi

# Check disk space
DISK_USAGE=$(df -h / | awk 'NR==2 {print $5}' | sed 's/%//')
if [ $DISK_USAGE -gt 80 ]; then
  echo "$(date): ALERTA - Disco al ${DISK_USAGE}%" >> $LOG_FILE
fi
```

```bash
chmod +x /home/hospital_app/healthcheck.sh

# Ejecutar cada 5 minutos
crontab -e
```

```cron
*/5 * * * * /home/hospital_app/healthcheck.sh
```

---

## Troubleshooting

### Problema: Backend no inicia

**Diagnóstico:**
```bash
# Ver logs de PM2
pm2 logs hospital-api --err

# Intentar iniciar manualmente para ver errores
cd /home/hospital_app/claude-repo/backend
node server.js
```

**Soluciones comunes:**
- Verificar .env (DB_PASSWORD, JWT_SECRET)
- Verificar que MySQL está corriendo
- Verificar que puerto 3000 está disponible

### Problema: No se puede conectar a MySQL

**Diagnóstico:**
```bash
# Verificar servicio
sudo systemctl status mysql

# Intentar conexión manual
mysql -u hospital_app -p
```

**Soluciones:**
- Verificar contraseña en .env
- Verificar que usuario tiene permisos
- Reiniciar MySQL: `sudo systemctl restart mysql`

### Problema: 502 Bad Gateway en Nginx

**Causa:** Backend no está corriendo

**Solución:**
```bash
# Verificar PM2
pm2 status

# Reiniciar backend
pm2 restart hospital-api

# Ver logs de Nginx
sudo tail -f /var/log/nginx/hospital_error.log
```

### Problema: Importación falla

**Diagnóstico:**
- Ver logs del backend
- Verificar tamaño del archivo (límite: 10MB)
- Verificar formato CSV

**Solución:**
```bash
# Aumentar límite en Nginx si es necesario
sudo nano /etc/nginx/sites-available/hospital_app

# Cambiar:
client_max_body_size 20M;  # De 10M a 20M

sudo systemctl reload nginx
```

---

## Comandos Útiles

```bash
# Estado de servicios
sudo systemctl status nginx
sudo systemctl status mysql
pm2 status

# Reiniciar servicios
sudo systemctl restart nginx
sudo systemctl restart mysql
pm2 restart hospital-api

# Ver logs
pm2 logs hospital-api
sudo tail -f /var/log/nginx/hospital_error.log
sudo tail -f /var/log/mysql/error.log

# Uso de recursos
htop           # Vista general
pm2 monit      # Específico de Node.js
df -h          # Espacio en disco
free -h        # Memoria

# Backup manual
mysqldump -u hospital_app -p hospital_patients > backup.sql

# Restore
mysql -u hospital_app -p hospital_patients < backup.sql
```

---

## Checklist de Despliegue

- [ ] Servidor configurado y actualizado
- [ ] Node.js, MySQL, Nginx instalados
- [ ] Base de datos creada y schema importado
- [ ] Usuario admin creado en DB
- [ ] Variables de entorno configuradas (.env)
- [ ] Frontend compilado (npm run build)
- [ ] Backend corriendo con PM2
- [ ] Nginx configurado y corriendo
- [ ] SSL/TLS configurado (si aplica)
- [ ] Firewall configurado
- [ ] Backups automáticos configurados
- [ ] Health checks funcionando
- [ ] Logs configurados
- [ ] Documentación actualizada
- [ ] Pruebas de funcionalidad completadas
- [ ] Capacitación de usuarios realizada

---

## Contacto de Soporte

Para problemas en producción, contactar:
- **Sistemas del Hospital**: Tel. XXXX ext. YYYY
- **Email**: sistemas@hospital.local

---

## Notas Finales

- Cambiar **todas** las contraseñas por defecto
- Realizar backups regulares
- Monitorear logs periódicamente
- Mantener el sistema actualizado
- Documentar cualquier cambio de configuración

**Esta aplicación maneja datos médicos sensibles. Asegurar cumplimiento de normativas de privacidad (GDPR, HIPAA, etc.) según jurisdicción.**
