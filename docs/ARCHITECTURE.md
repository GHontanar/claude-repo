# Arquitectura del Sistema - Patient Tracking System

## Índice
1. [Visión General](#visión-general)
2. [Arquitectura de Alto Nivel](#arquitectura-de-alto-nivel)
3. [Componentes del Sistema](#componentes-del-sistema)
4. [Flujo de Datos](#flujo-de-datos)
5. [Patrones de Diseño](#patrones-de-diseño)
6. [Seguridad](#seguridad)
7. [Escalabilidad](#escalabilidad)

---

## Visión General

### Propósito
Sistema web cliente-servidor para la gestión de pacientes con enfermedades raras en un entorno hospitalario seguro.

### Arquitectura
- **Patrón**: Cliente-Servidor (Three-Tier Architecture)
- **Comunicación**: RESTful API sobre HTTP/HTTPS
- **Estado**: Stateless (JWT para autenticación)
- **Despliegue**: On-premise (servidor interno del hospital)

### Principios de Diseño
1. **Separación de Responsabilidades**: Backend/Frontend desacoplados
2. **Seguridad por Diseño**: Sin conexiones externas, datos encriptados
3. **Simplicidad**: Interfaz intuitiva para usuarios médicos
4. **Mantenibilidad**: Código modular y documentado
5. **Escalabilidad**: Preparado para crecimiento de datos

---

## Arquitectura de Alto Nivel

```
┌─────────────────────────────────────────────────────────────┐
│                      NAVEGADOR WEB                          │
│  ┌────────────────────────────────────────────────────────┐ │
│  │           React Application (Frontend)                 │ │
│  │  - Components (UI)                                     │ │
│  │  - Context API (State Management)                      │ │
│  │  - Axios (HTTP Client)                                 │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ HTTP/HTTPS (JSON)
                            ▼
┌─────────────────────────────────────────────────────────────┐
│               Node.js/Express Server (Backend)              │
│  ┌────────────────────────────────────────────────────────┐ │
│  │  Routes (API Endpoints)                                │ │
│  │    ↓                                                    │ │
│  │  Middleware (Auth, Validation)                         │ │
│  │    ↓                                                    │ │
│  │  Controllers (Business Logic)                          │ │
│  │    ↓                                                    │ │
│  │  Models (Data Access Layer)                            │ │
│  └────────────────────────────────────────────────────────┘ │
└─────────────────────────────────────────────────────────────┘
                            │
                            │ SQL Queries
                            ▼
┌─────────────────────────────────────────────────────────────┐
│                   MySQL Database                            │
│  - Tabla: usuarios                                          │
│  - Tabla: pacientes                                         │
│  - Índices y relaciones                                     │
└─────────────────────────────────────────────────────────────┘
```

---

## Componentes del Sistema

### 1. Frontend (React)

#### Estructura de Carpetas
```
frontend/src/
├── components/          # Componentes React
│   ├── Auth/           # Login, protección de rutas
│   ├── Admin/          # Panel admin (importar, usuarios)
│   ├── Search/         # Búsquedas (NHC, diagnóstico, listado)
│   ├── Stats/          # Dashboard de estadísticas
│   └── Common/         # Componentes reutilizables
├── contexts/           # Context API (AuthContext)
├── services/           # Llamadas a API (axios)
├── App.jsx             # Componente raíz + routing
└── main.jsx            # Punto de entrada
```

#### Responsabilidades
- **Renderizado de UI**: Componentes visuales con Material-UI
- **Gestión de Estado**: Context API para autenticación
- **Routing**: React Router para navegación
- **Comunicación con Backend**: Axios con interceptors JWT
- **Validación de Formularios**: Validación client-side
- **Exportación**: Generación de XLSX en frontend

#### Flujo de Autenticación (Frontend)
```
1. Usuario ingresa credenciales
2. POST /api/auth/login → Backend
3. Recibe JWT + datos de usuario
4. Guarda JWT en localStorage
5. Actualiza AuthContext
6. Redirige según rol (admin → /admin, usuario → /search)
7. Axios interceptor añade JWT a todas las peticiones
```

---

### 2. Backend (Node.js/Express)

#### Estructura de Carpetas
```
backend/
├── config/
│   └── database.js         # Conexión MySQL con pool
├── middleware/
│   ├── auth.js             # Verificación JWT
│   ├── roleCheck.js        # Verificación de roles
│   └── validation.js       # Validación de datos
├── routes/
│   ├── auth.js             # Login/logout
│   ├── users.js            # CRUD usuarios (admin only)
│   ├── patients.js         # Búsquedas de pacientes
│   ├── import.js           # Importación CSV/XLSX (admin only)
│   └── export.js           # Exportación XLSX
├── controllers/
│   ├── authController.js
│   ├── userController.js
│   ├── patientController.js
│   ├── importController.js
│   └── exportController.js
├── models/
│   ├── User.js             # Modelo de usuario
│   └── Patient.js          # Modelo de paciente
├── utils/
│   ├── csvParser.js        # Parseo CSV/XLSX
│   ├── xlsxGenerator.js    # Generación XLSX
│   └── validators.js       # Funciones de validación
└── server.js               # Punto de entrada
```

#### Responsabilidades
- **API RESTful**: Endpoints para todas las operaciones
- **Autenticación**: Generación y validación de JWT
- **Autorización**: Control de acceso por roles
- **Lógica de Negocio**: Procesamiento de datos
- **Acceso a Datos**: Queries a MySQL
- **Procesamiento de Archivos**: Importación CSV/XLSX
- **Validación**: Server-side validation de todos los inputs

#### Capas del Backend

**Capa de Rutas (Routes)**
- Define los endpoints de la API
- Aplica middleware de autenticación y validación
- Delega a los controladores

**Capa de Middleware**
```javascript
// auth.js - Verificación de JWT
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  // Valida JWT y añade req.user
};

// roleCheck.js - Verificación de roles
const requireAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({ error: 'Forbidden' });
  }
  next();
};
```

**Capa de Controladores (Controllers)**
- Contiene la lógica de negocio
- Valida datos de entrada
- Llama a los modelos
- Formatea respuestas

**Capa de Modelos (Models)**
- Interacción directa con MySQL
- Queries preparadas (prepared statements)
- Retorna datos o errores

---

### 3. Base de Datos (MySQL)

#### Modelo de Datos

**Tabla: usuarios**
```sql
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) UNIQUE NOT NULL,
  password VARCHAR(255) NOT NULL,  -- Hash bcrypt
  rol ENUM('admin', 'usuario') NOT NULL DEFAULT 'usuario',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_username (username)
);
```

**Tabla: pacientes**
```sql
CREATE TABLE pacientes (
  nhc VARCHAR(50) PRIMARY KEY,
  diagnosticos JSON NOT NULL,  -- Array de códigos ORPHA
  fecha_ultimo_seguimiento DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_fecha (fecha_ultimo_seguimiento)
);

-- Índice funcional para búsquedas por diagnóstico
CREATE INDEX idx_diagnosticos ON pacientes ((CAST(diagnosticos AS CHAR(1000) ARRAY)));
```

#### Relaciones
- No hay relaciones entre tablas (denormalizado intencionalmente)
- `pacientes.diagnosticos` es JSON para flexibilidad
- Búsquedas optimizadas con índices

#### Estrategia de Datos JSON
```json
// Ejemplo de pacientes.diagnosticos
["ORPHA123", "ORPHA456", "ORPHA789"]
```

**Ventajas:**
- Número variable de diagnósticos por paciente
- Fácil añadir/eliminar diagnósticos
- No requiere tabla de relación muchos-a-muchos

**Búsqueda en JSON:**
```sql
-- Buscar pacientes con diagnóstico ORPHA123
SELECT * FROM pacientes
WHERE JSON_CONTAINS(diagnosticos, '"ORPHA123"');
```

---

## Flujo de Datos

### Flujo de Importación de Datos

```
1. Admin sube archivo CSV/XLSX
   ↓
2. Backend recibe archivo (multer)
   ↓
3. Parser procesa línea por línea
   ↓
4. Para cada línea:
   a. Valida formato (NHC, diagnósticos, fecha)
   b. Busca paciente en DB por NHC
   c. SI EXISTE:
      - Parsea diagnósticos actuales y nuevos
      - Combina arrays sin duplicados
      - Actualiza solo si fecha nueva > fecha actual
   d. SI NO EXISTE:
      - Crea nuevo registro
   ↓
5. Retorna resumen:
   - Pacientes nuevos: X
   - Pacientes actualizados: Y
   - Errores: Z
```

**Pseudocódigo:**
```javascript
async function processImportRow(row) {
  const { nhc, diagnosticos, fecha } = parseRow(row);

  const existingPatient = await Patient.findByNHC(nhc);

  if (existingPatient) {
    // Combinar diagnósticos
    const currentDiagnosticos = existingPatient.diagnosticos;
    const newDiagnosticos = diagnosticos.split(',');
    const merged = [...new Set([...currentDiagnosticos, ...newDiagnosticos])];

    // Actualizar solo si fecha es más reciente
    if (new Date(fecha) > new Date(existingPatient.fecha_ultimo_seguimiento)) {
      await Patient.update(nhc, {
        diagnosticos: merged,
        fecha_ultimo_seguimiento: fecha
      });
      return { type: 'updated' };
    }
    return { type: 'skipped' };
  } else {
    await Patient.create({
      nhc,
      diagnosticos: diagnosticos.split(','),
      fecha_ultimo_seguimiento: fecha
    });
    return { type: 'created' };
  }
}
```

---

### Flujo de Búsqueda

**Búsqueda por NHC:**
```
Usuario → Input NHC → Frontend valida →
GET /api/patients/:nhc → Backend busca en DB →
Retorna paciente o 404 → Frontend muestra resultado
```

**Búsqueda por Diagnóstico:**
```
Usuario → Input código ORPHA → Frontend valida →
GET /api/patients?diagnostico=ORPHA123 →
Backend query con JSON_CONTAINS →
Retorna array de pacientes → Frontend muestra tabla →
Usuario puede exportar a XLSX
```

**Listado Completo:**
```
Usuario → Click "Ver todos" →
GET /api/patients?limit=100&offset=0 →
Backend query con paginación →
Retorna pacientes + total count →
Frontend muestra tabla paginada
```

---

### Flujo de Exportación

```
1. Usuario selecciona datos a exportar
   ↓
2. Frontend hace petición GET con filtros
   ↓
3. Backend obtiene datos de DB
   ↓
4. xlsxGenerator crea archivo en memoria
   ↓
5. Backend envía archivo como blob
   ↓
6. Frontend descarga archivo
```

**Formato XLSX generado:**
```
| NHC   | Diagnósticos      | Fecha Último Seguimiento |
|-------|-------------------|--------------------------|
| 12345 | ORPHA123,ORPHA456 | 2024-05-15              |
| 67890 | ORPHA789          | 2024-06-20              |
```

---

## Patrones de Diseño

### 1. MVC (Model-View-Controller)
- **Model**: Modelos en `backend/models/`
- **View**: Componentes React en `frontend/src/components/`
- **Controller**: Controladores en `backend/controllers/`

### 2. Middleware Chain
```javascript
// Ejemplo de ruta con middleware chain
router.post('/patients',
  verifyToken,           // Autenticación
  requireAdmin,          // Autorización
  validatePatientData,   // Validación
  patientController.create  // Controlador
);
```

### 3. Repository Pattern
Los modelos actúan como repositorios:
```javascript
class Patient {
  static async findByNHC(nhc) { /* ... */ }
  static async findByDiagnostico(codigo) { /* ... */ }
  static async findAll(limit, offset) { /* ... */ }
  static async create(data) { /* ... */ }
  static async update(nhc, data) { /* ... */ }
}
```

### 4. Singleton - Database Connection
```javascript
// config/database.js
const mysql = require('mysql2/promise');

const pool = mysql.createPool({
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

module.exports = pool;
```

### 5. Strategy Pattern - File Parsing
```javascript
class FileParser {
  constructor(fileType) {
    this.strategy = fileType === 'csv'
      ? new CSVParser()
      : new XLSXParser();
  }

  parse(file) {
    return this.strategy.parse(file);
  }
}
```

---

## Seguridad

### Autenticación y Autorización

**JWT (JSON Web Token)**
```javascript
// Generación de token
const token = jwt.sign(
  { id: user.id, username: user.username, rol: user.rol },
  process.env.JWT_SECRET,
  { expiresIn: '8h' }
);

// Estructura del token
{
  "id": 1,
  "username": "admin",
  "rol": "admin",
  "iat": 1234567890,
  "exp": 1234596690
}
```

**Flujo de Autenticación:**
1. Usuario → POST /api/auth/login con credenciales
2. Backend verifica hash de contraseña (bcrypt)
3. Si válido → genera JWT
4. Frontend guarda JWT en localStorage
5. Cada petición incluye: `Authorization: Bearer <token>`
6. Backend verifica JWT en middleware

**Autorización por Roles:**
```javascript
// Middleware de verificación de rol
const requireAdmin = (req, res, next) => {
  if (req.user.rol !== 'admin') {
    return res.status(403).json({
      error: 'Acceso denegado: requiere rol de administrador'
    });
  }
  next();
};

// Uso en rutas
router.post('/users', verifyToken, requireAdmin, userController.create);
```

---

### Protección contra Vulnerabilidades

**SQL Injection**
```javascript
// ❌ VULNERABLE
const query = `SELECT * FROM pacientes WHERE nhc = '${nhc}'`;

// ✅ SEGURO - Prepared Statements
const [rows] = await pool.execute(
  'SELECT * FROM pacientes WHERE nhc = ?',
  [nhc]
);
```

**XSS (Cross-Site Scripting)**
```javascript
// Validación y sanitización de inputs
const sanitizeInput = (input) => {
  return input.replace(/[<>]/g, '');
};
```

**CSRF (Cross-Site Request Forgery)**
- Protección mediante JWT (stateless)
- CORS configurado para orígenes específicos

**CORS Configuration**
```javascript
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));
```

---

### Encriptación de Contraseñas

```javascript
// Al crear usuario
const bcrypt = require('bcrypt');
const saltRounds = 10;
const hashedPassword = await bcrypt.hash(password, saltRounds);

// Al verificar login
const isMatch = await bcrypt.compare(password, user.password);
```

---

### Variables de Entorno Sensibles

```bash
# .env (NUNCA commitear)
DB_HOST=localhost
DB_USER=hospital_user
DB_PASSWORD=SecureP@ssw0rd!
DB_NAME=hospital_patients
JWT_SECRET=super-secret-key-change-in-production
PORT=3000
NODE_ENV=production
```

---

## Escalabilidad

### Capacidad Actual

**Estimaciones:**
- **Pacientes**: 10,000 - 50,000 registros
- **Usuarios**: 5-10 concurrentes
- **Importaciones**: 1 archivo anual (~5,000 filas)
- **Búsquedas**: ~100 queries/día

### Optimizaciones Implementadas

**1. Connection Pool (MySQL)**
```javascript
const pool = mysql.createPool({
  connectionLimit: 10,  // Máximo conexiones simultáneas
  queueLimit: 0         // Sin límite de cola
});
```

**2. Índices de Base de Datos**
- Índice en `usuarios.username` (búsquedas de login)
- Índice en `pacientes.fecha_ultimo_seguimiento` (ordenamiento)
- Índice funcional en `pacientes.diagnosticos` (búsquedas JSON)

**3. Paginación**
```javascript
// Limitar resultados grandes
GET /api/patients?limit=100&offset=0
```

**4. Procesamiento por Lotes (Importación)**
```javascript
// Insertar múltiples pacientes en una transacción
const connection = await pool.getConnection();
await connection.beginTransaction();
try {
  for (const patient of patients) {
    await connection.execute(INSERT_QUERY, [patient.data]);
  }
  await connection.commit();
} catch (error) {
  await connection.rollback();
  throw error;
} finally {
  connection.release();
}
```

---

### Plan de Escalabilidad Futura

**Si el sistema crece:**

**1. Horizontal Scaling**
- Múltiples instancias del backend con load balancer
- Session storage en Redis (en lugar de JWT stateless)

**2. Database Optimization**
- Read replicas para búsquedas
- Master-slave configuration
- Cacheo con Redis (diagnósticos frecuentes)

**3. File Processing**
- Queue system (RabbitMQ/Bull) para importaciones grandes
- Procesamiento asíncrono en background workers

**4. Monitoring**
- Logs estructurados (Winston)
- Métricas (Prometheus)
- Alertas (Grafana)

---

## Tecnologías y Justificación

| Tecnología | Justificación |
|------------|---------------|
| **Node.js** | Performance, ecosystem npm, mismo lenguaje front/back |
| **Express** | Framework minimalista, flexible, bien documentado |
| **MySQL** | Relacional, transacciones ACID, JSON support |
| **JWT** | Stateless, escalable, estándar de industria |
| **React** | Component-based, virtual DOM, gran comunidad |
| **bcrypt** | Hash seguro de contraseñas, resistente a ataques |
| **Material-UI** | Componentes profesionales, accesibles, responsive |

---

## Diagramas Adicionales

### Diagrama de Secuencia - Importación de Datos

```
Admin         Frontend       Backend       Database
  |              |              |              |
  |--Upload CSV->|              |              |
  |              |--POST /import->|            |
  |              |              |--Parse file->|
  |              |              |              |
  |              |              |--Query NHC-->|
  |              |              |<--Result-----|
  |              |              |              |
  |              |              |--INSERT/UPDATE|
  |              |              |<--OK---------|
  |              |              |              |
  |              |<--Summary----|              |
  |<--Report-----|              |              |
```

### Diagrama de Componentes React

```
App
├── AuthProvider (Context)
│   ├── Login
│   └── ProtectedRoute
│       ├── Admin Dashboard
│       │   ├── ImportData
│       │   ├── UserManagement
│       │   └── Statistics
│       └── User Dashboard
│           ├── SearchByNHC
│           ├── SearchByDiagnosis
│           ├── PatientList
│           └── Statistics
```

---

## Conclusión

Esta arquitectura proporciona:
- ✅ **Seguridad**: Múltiples capas de protección
- ✅ **Mantenibilidad**: Código modular y documentado
- ✅ **Escalabilidad**: Preparado para crecer
- ✅ **Usabilidad**: Interfaz simple para usuarios médicos
- ✅ **Privacidad**: Sin conexiones externas, datos locales

El sistema está diseñado para ser mantenido por ingenieros de sistemas del hospital sin conocimiento previo del proyecto.
