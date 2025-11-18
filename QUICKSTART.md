# 🚀 Inicio Rápido - Sistema de Pacientes

## Para Probar la Aplicación (5 minutos)

### En Ubuntu (Prueba Local)

```bash
# 1. Clonar el proyecto
git clone <repository-url>
cd claude-repo

# 2. Ejecutar instalador
./install.sh

# 3. Acceder a la app
# Abre tu navegador en: http://localhost
```

**Credenciales:**
- Usuario: `admin`
- Contraseña: `Hospital2024!`

---

## ¿Qué hace el instalador?

✅ Verifica si Docker está instalado (lo instala si hace falta)
✅ Crea la configuración automáticamente
✅ Levanta MySQL, Backend y Frontend
✅ ¡Todo listo en 1 minuto!

---

## Comandos Útiles

```bash
# Ver logs en tiempo real
docker compose logs -f

# Detener la aplicación
docker compose stop

# Iniciar la aplicación
docker compose start

# Reiniciar todo
docker compose restart

# Crear backup
./backup.sh

# Apagar todo
docker compose down
```

---

## Probar las Funcionalidades

### 1️⃣ Login
- Abre http://localhost
- Usuario: `admin` / Contraseña: `Hospital2024!`

### 2️⃣ Ver Pacientes de Ejemplo
- Click en "Búsquedas" → pestaña "Listado Completo"
- Verás 10 pacientes de ejemplo

### 3️⃣ Buscar Paciente
- Click en "Búsquedas" → pestaña "Buscar por NHC"
- Busca el NHC: `12345`
- Verás el paciente con sus diagnósticos

### 4️⃣ Importar Datos
- Click en "Importar"
- Sube el archivo: `test_data/ejemplo.csv`
- Verás el resumen de la importación

### 5️⃣ Ver Estadísticas
- Click en "Estadísticas"
- Verás gráficos y métricas del sistema

### 6️⃣ Gestionar Usuarios (Admin)
- Click en "Usuarios"
- Prueba crear un usuario nuevo
- Cambia contraseñas
- Elimina usuarios

### 7️⃣ Exportar Datos
- En cualquier búsqueda, click "Exportar a Excel"
- Se descargará un archivo .xlsx

---

## En el Servidor del Hospital

### Opción A: Copiar Archivos

```bash
# En tu PC local, crear archivo comprimido
tar -czf hospital-app.tar.gz claude-repo/

# Copiar al servidor
scp hospital-app.tar.gz usuario@servidor-hospital:/home/usuario/

# En el servidor
ssh usuario@servidor-hospital
tar -xzf hospital-app.tar.gz
cd claude-repo
./install.sh
```

### Opción B: Con Git

```bash
# En el servidor
ssh usuario@servidor-hospital
git clone <repository-url>
cd claude-repo
./install.sh
```

---

## Cambiar Puerto (Opcional)

Si el puerto 80 está ocupado:

```bash
# Editar .env
nano .env

# Cambiar esta línea
APP_PORT=8080

# Reiniciar
docker compose down
docker compose up -d

# Acceder en http://localhost:8080
```

---

## Solución de Problemas

### "Cannot connect to Docker daemon"
```bash
# Iniciar Docker
sudo systemctl start docker

# Añadirte al grupo docker (luego cerrar y abrir terminal)
sudo usermod -aG docker $USER
```

### "Port 80 already in use"
```bash
# Ver qué usa el puerto 80
sudo lsof -i :80

# Cambiar APP_PORT en .env a otro puerto
```

### "MySQL container keeps restarting"
```bash
# Ver logs
docker compose logs mysql

# Esperar 30 segundos (MySQL tarda en iniciar)
```

---

## Próximos Pasos

1. **Cambiar contraseñas** en `.env` (producción)
2. **Configurar backups automáticos** (ver [DOCKER.md](docs/DOCKER.md))
3. **Leer documentación completa** en `/docs`

---

## Ayuda

- **Guía Docker Completa**: [docs/DOCKER.md](docs/DOCKER.md)
- **Documentación Técnica**: [docs/](docs/)
- **Ver logs**: `docker compose logs -f`

¡Disfruta tu aplicación! 🎉
