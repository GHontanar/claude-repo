# Sistema de Seguimiento de Pacientes - Hospital

## Descripción

Aplicación web segura para la gestión y seguimiento de pacientes con enfermedades raras en un entorno hospitalario. El sistema permite importar datos de consultas médicas, mantener un registro único de pacientes, y realizar búsquedas y exportaciones de datos.

## Características Principales

- **Gestión de Pacientes**: Base de datos centralizada de pacientes únicos con sus diagnósticos (códigos ORPHA) y fecha de último seguimiento
- **Importación de Datos**: Carga anual de archivos CSV/XLSX con actualización inteligente de registros
- **Búsquedas Avanzadas**: Por número de historia clínica, diagnóstico o listado completo
- **Exportación**: Generación de archivos XLSX para análisis
- **Autenticación JWT**: Sistema seguro de autenticación con dos roles (Admin/Usuario)
- **Gestión de Usuarios**: Panel de administración para crear/modificar/eliminar usuarios
- **Estadísticas Básicas**: Dashboard con métricas del sistema

## Tecnologías

### Backend
- **Node.js** + **Express.js**: Framework del servidor
- **MySQL**: Base de datos relacional
- **JWT**: Autenticación y autorización
- **bcrypt**: Encriptación de contraseñas
- **multer**: Manejo de archivos subidos
- **xlsx**: Procesamiento de archivos Excel

### Frontend
- **React.js**: Framework UI
- **React Router**: Navegación
- **Axios**: Cliente HTTP
- **Material-UI**: Componentes visuales
- **Recharts**: Visualización de estadísticas

## Estructura del Proyecto

```
/
├── backend/                 # Servidor Node.js/Express
│   ├── config/             # Configuraciones (DB, JWT)
│   ├── middleware/         # Middlewares (auth, validation)
│   ├── routes/             # Rutas de la API
│   ├── models/             # Modelos de datos
│   ├── controllers/        # Lógica de negocio
│   ├── utils/              # Utilidades (parsers, generators)
│   ├── server.js           # Punto de entrada del servidor
│   └── package.json
│
├── frontend/               # Aplicación React
│   ├── src/
│   │   ├── components/     # Componentes React
│   │   ├── contexts/       # Context API (Auth)
│   │   ├── services/       # Servicios (API calls)
│   │   ├── App.jsx         # Componente principal
│   │   └── main.jsx        # Punto de entrada
│   └── package.json
│
├── docs/                   # Documentación técnica
│   ├── ARCHITECTURE.md     # Arquitectura del sistema
│   ├── API_DOCUMENTATION.md # Documentación de APIs
│   ├── DATABASE_SCHEMA.md  # Esquema de base de datos
│   ├── DEVELOPMENT.md      # Guía de desarrollo
│   └── DEPLOYMENT.md       # Guía de despliegue
│
├── sql/                    # Scripts SQL
│   ├── schema.sql          # Creación de tablas
│   └── seed.sql            # Datos iniciales
│
├── .env.example            # Ejemplo de variables de entorno
└── README.md               # Este archivo
```

## Instalación (Recomendado: Docker)

### 🐳 Instalación con Docker (Más Fácil)

**Solo 2 pasos:**

```bash
# 1. Clonar repositorio
git clone <repository-url>
cd claude-repo

# 2. Ejecutar instalador
./install.sh
```

**¡Listo!** Accede a http://localhost

El script instalará Docker automáticamente si no lo tienes y levantará toda la aplicación (MySQL + Backend + Frontend).

**Comandos útiles:**
```bash
./backup.sh        # Crear backup de la base de datos
./update.sh        # Actualizar la aplicación
./restore.sh       # Restaurar desde un backup
docker compose logs -f  # Ver logs en tiempo real
```

📖 **[Guía Completa de Docker](docs/DOCKER.md)**

---

### 📦 Instalación Manual (Avanzado)

Si prefieres instalación nativa sin Docker:

**Requisitos:**
- **Node.js**: v18.x o superior
- **MySQL**: v8.0 o superior
- **npm**: v9.x o superior

**Pasos:**

1. **Configurar Base de Datos**
   ```bash
   mysql -u root -p < sql/schema.sql
   mysql -u root -p < sql/seed.sql
   ```

2. **Backend**
   ```bash
   cd backend
   npm install
   cp .env.example .env
   # Editar .env con tus configuraciones
   npm start
   ```

3. **Frontend**
   ```bash
   cd frontend
   npm install
   cp .env.example .env
   npm run dev
   ```

📖 **[Guía Completa de Instalación Manual](docs/DEPLOYMENT.md)**

## Uso Básico

### Login Inicial
- **Usuario por defecto**: `admin`
- **Contraseña por defecto**: `Hospital2024!` (cambiar inmediatamente)

### Roles de Usuario

#### Administrador
- Importar archivos CSV/XLSX
- Gestionar usuarios (crear, modificar, eliminar)
- Todas las búsquedas y exportaciones
- Ver estadísticas

#### Usuario
- Buscar pacientes por NHC
- Buscar por diagnóstico
- Ver listado completo
- Exportar resultados a XLSX
- Ver estadísticas

## Seguridad

⚠️ **IMPORTANTE**: Esta aplicación maneja datos sensibles de pacientes.

- ✅ **Sin conexiones externas**: Diseñada para red interna del hospital
- ✅ **Autenticación JWT**: Tokens de sesión seguros
- ✅ **Contraseñas encriptadas**: bcrypt con salt rounds
- ✅ **Validación de inputs**: Prevención de SQL injection y XSS
- ✅ **CORS restringido**: Solo orígenes autorizados
- ✅ **HTTPS recomendado**: En producción

## Flujo de Trabajo Típico

1. **Exportación anual** desde el sistema del hospital → archivo CSV
2. **Admin** inicia sesión en la aplicación
3. **Importa el archivo** en el panel de administración
4. Sistema procesa:
   - Pacientes nuevos → Se añaden
   - Pacientes existentes → Se actualiza fecha y diagnósticos
5. **Usuarios** pueden buscar y exportar datos según necesidades

## Formato de Archivo de Importación

**CSV con las siguientes columnas:**
```csv
NHC,Diagnosticos,Fecha
12345,"ORPHA123,ORPHA456",2024-05-15
67890,"ORPHA789",2024-06-20
```

**Características:**
- Diagnósticos separados por comas
- Formato de fecha: YYYY-MM-DD
- Codificación: UTF-8

## Documentación Adicional

- **[🐳 Docker Guide](docs/DOCKER.md)**: Instalación y uso con Docker (RECOMENDADO)
- **[Arquitectura del Sistema](docs/ARCHITECTURE.md)**: Diseño técnico detallado
- **[API Documentation](docs/API_DOCUMENTATION.md)**: Endpoints y ejemplos
- **[Database Schema](docs/DATABASE_SCHEMA.md)**: Estructura de tablas
- **[Development Guide](docs/DEVELOPMENT.md)**: Guía para desarrolladores
- **[Deployment Guide](docs/DEPLOYMENT.md)**: Instalación manual en producción

## Soporte y Mantenimiento

Para continuar el desarrollo o realizar modificaciones:
1. Revisar la documentación en `/docs`
2. Seguir las guías de desarrollo
3. Respetar la estructura de carpetas establecida
4. Realizar pruebas antes de desplegar cambios

## Licencia

Uso interno del hospital. Todos los derechos reservados.

## Contacto

Para soporte técnico, contactar al departamento de sistemas del hospital.
