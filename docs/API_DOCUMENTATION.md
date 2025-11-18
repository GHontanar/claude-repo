# API Documentation - Patient Tracking System

## Base URL

```
Development: http://localhost:3000/api
Production: https://hospital-server.local/api
```

## Autenticación

Todos los endpoints (excepto `/auth/login`) requieren autenticación mediante JWT.

**Header requerido:**
```
Authorization: Bearer <token>
```

**Formato de error de autenticación:**
```json
{
  "error": "Token inválido o expirado",
  "code": "AUTH_ERROR"
}
```

---

## Índice de Endpoints

### Autenticación
- [POST /auth/login](#post-authlogin) - Iniciar sesión
- [POST /auth/logout](#post-authlogout) - Cerrar sesión
- [GET /auth/me](#get-authme) - Obtener usuario actual

### Usuarios (Solo Admin)
- [GET /users](#get-users) - Listar usuarios
- [POST /users](#post-users) - Crear usuario
- [PUT /users/:id/password](#put-usersidpassword) - Cambiar contraseña
- [DELETE /users/:id](#delete-usersid) - Eliminar usuario

### Pacientes
- [GET /patients/:nhc](#get-patientsnhc) - Buscar por NHC
- [GET /patients](#get-patients) - Listar/buscar pacientes
- [GET /patients/stats](#get-patientsstats) - Estadísticas

### Importación (Solo Admin)
- [POST /import](#post-import) - Importar CSV/XLSX

### Exportación
- [GET /export/patients](#get-exportpatients) - Exportar a XLSX

---

## Endpoints Detallados

### Autenticación

#### POST /auth/login

Iniciar sesión y obtener token JWT.

**Request:**
```http
POST /api/auth/login
Content-Type: application/json

{
  "username": "admin",
  "password": "Hospital2024!"
}
```

**Response (200 OK):**
```json
{
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "user": {
    "id": 1,
    "username": "admin",
    "rol": "admin"
  }
}
```

**Errores:**
- `400 Bad Request`: Campos faltantes
- `401 Unauthorized`: Credenciales inválidas

```json
{
  "error": "Usuario o contraseña incorrectos"
}
```

---

#### POST /auth/logout

Cerrar sesión (invalidar token en frontend).

**Request:**
```http
POST /api/auth/logout
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Sesión cerrada correctamente"
}
```

---

#### GET /auth/me

Obtener información del usuario actual.

**Request:**
```http
GET /api/auth/me
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "id": 1,
  "username": "admin",
  "rol": "admin",
  "created_at": "2024-01-15T10:30:00Z"
}
```

---

### Usuarios

#### GET /users

Listar todos los usuarios. **Requiere rol: admin**

**Request:**
```http
GET /api/users
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "users": [
    {
      "id": 1,
      "username": "admin",
      "rol": "admin",
      "created_at": "2024-01-15T10:30:00Z"
    },
    {
      "id": 2,
      "username": "medico1",
      "rol": "usuario",
      "created_at": "2024-02-01T14:20:00Z"
    }
  ]
}
```

**Errores:**
- `403 Forbidden`: Usuario no es admin

---

#### POST /users

Crear nuevo usuario. **Requiere rol: admin**

**Request:**
```http
POST /api/users
Authorization: Bearer <token>
Content-Type: application/json

{
  "username": "medico2",
  "password": "SecurePass123!",
  "rol": "usuario"
}
```

**Validaciones:**
- `username`: 3-50 caracteres, alfanumérico
- `password`: Mínimo 8 caracteres, al menos 1 mayúscula, 1 número
- `rol`: "admin" o "usuario"

**Response (201 Created):**
```json
{
  "message": "Usuario creado correctamente",
  "user": {
    "id": 3,
    "username": "medico2",
    "rol": "usuario",
    "created_at": "2024-03-01T09:15:00Z"
  }
}
```

**Errores:**
- `400 Bad Request`: Validación fallida
- `409 Conflict`: Username ya existe

```json
{
  "error": "El username ya está en uso",
  "field": "username"
}
```

---

#### PUT /users/:id/password

Cambiar contraseña de un usuario. **Requiere rol: admin**

**Request:**
```http
PUT /api/users/2/password
Authorization: Bearer <token>
Content-Type: application/json

{
  "newPassword": "NewSecurePass456!"
}
```

**Response (200 OK):**
```json
{
  "message": "Contraseña actualizada correctamente"
}
```

**Errores:**
- `404 Not Found`: Usuario no existe
- `400 Bad Request`: Contraseña no cumple requisitos

---

#### DELETE /users/:id

Eliminar usuario. **Requiere rol: admin**

**Request:**
```http
DELETE /api/users/2
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "message": "Usuario eliminado correctamente"
}
```

**Errores:**
- `404 Not Found`: Usuario no existe
- `400 Bad Request`: No se puede eliminar el último admin
- `400 Bad Request`: No se puede eliminar a sí mismo

```json
{
  "error": "No se puede eliminar el último administrador del sistema"
}
```

---

### Pacientes

#### GET /patients/:nhc

Buscar paciente por número de historia clínica.

**Request:**
```http
GET /api/patients/12345
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "nhc": "12345",
  "diagnosticos": ["ORPHA123", "ORPHA456", "ORPHA789"],
  "fecha_ultimo_seguimiento": "2024-05-15",
  "created_at": "2023-01-10T08:00:00Z",
  "updated_at": "2024-05-16T12:30:00Z"
}
```

**Errores:**
- `404 Not Found`: Paciente no existe

```json
{
  "error": "Paciente no encontrado",
  "nhc": "12345"
}
```

---

#### GET /patients

Listar pacientes con filtros opcionales.

**Query Parameters:**
- `diagnostico` (string): Código ORPHA para filtrar
- `limit` (number): Número de resultados (default: 100, max: 1000)
- `offset` (number): Paginación (default: 0)
- `sort` (string): Campo de ordenamiento (default: "fecha_ultimo_seguimiento")
- `order` (string): "asc" o "desc" (default: "desc")

**Ejemplos:**

**1. Buscar por diagnóstico:**
```http
GET /api/patients?diagnostico=ORPHA123
Authorization: Bearer <token>
```

**2. Listar todos (paginado):**
```http
GET /api/patients?limit=50&offset=0
Authorization: Bearer <token>
```

**3. Ordenar por fecha ascendente:**
```http
GET /api/patients?sort=fecha_ultimo_seguimiento&order=asc
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "patients": [
    {
      "nhc": "12345",
      "diagnosticos": ["ORPHA123", "ORPHA456"],
      "fecha_ultimo_seguimiento": "2024-05-15"
    },
    {
      "nhc": "67890",
      "diagnosticos": ["ORPHA123"],
      "fecha_ultimo_seguimiento": "2024-06-20"
    }
  ],
  "pagination": {
    "total": 150,
    "limit": 50,
    "offset": 0,
    "hasMore": true
  }
}
```

---

#### GET /patients/stats

Obtener estadísticas generales del sistema.

**Request:**
```http
GET /api/patients/stats
Authorization: Bearer <token>
```

**Response (200 OK):**
```json
{
  "total_pacientes": 1250,
  "total_diagnosticos_unicos": 45,
  "pacientes_sin_seguimiento_reciente": 120,
  "diagnosticos_frecuentes": [
    {
      "codigo": "ORPHA123",
      "nombre": "Enfermedad Rara X",
      "count": 250
    },
    {
      "codigo": "ORPHA456",
      "nombre": "Enfermedad Rara Y",
      "count": 180
    }
  ],
  "pacientes_por_mes": [
    {
      "mes": "2024-01",
      "count": 50
    },
    {
      "mes": "2024-02",
      "count": 65
    }
  ]
}
```

---

### Importación

#### POST /import

Importar archivo CSV o XLSX con datos de pacientes. **Requiere rol: admin**

**Request:**
```http
POST /api/import
Authorization: Bearer <token>
Content-Type: multipart/form-data

file: [archivo.csv o archivo.xlsx]
```

**Formato esperado del archivo:**

**CSV:**
```csv
NHC,Diagnosticos,Fecha
12345,"ORPHA123,ORPHA456",2024-05-15
67890,"ORPHA789",2024-06-20
```

**XLSX:**
| NHC   | Diagnosticos      | Fecha      |
|-------|-------------------|------------|
| 12345 | ORPHA123,ORPHA456 | 2024-05-15 |
| 67890 | ORPHA789          | 2024-06-20 |

**Reglas de procesamiento:**
1. Si NHC existe:
   - Combinar diagnósticos sin duplicados
   - Actualizar fecha solo si es más reciente
2. Si NHC es nuevo:
   - Crear nuevo paciente

**Response (200 OK):**
```json
{
  "message": "Importación completada",
  "summary": {
    "total_filas": 500,
    "pacientes_nuevos": 150,
    "pacientes_actualizados": 320,
    "errores": 30
  },
  "errores_detalle": [
    {
      "fila": 45,
      "nhc": "ABC123",
      "error": "Formato de fecha inválido"
    },
    {
      "fila": 67,
      "nhc": "XYZ789",
      "error": "Código ORPHA inválido"
    }
  ]
}
```

**Validaciones:**
- Formato de archivo: .csv o .xlsx
- Tamaño máximo: 10MB
- Columnas requeridas: NHC, Diagnosticos, Fecha
- Formato de fecha: YYYY-MM-DD
- Códigos ORPHA: Formato ORPHAxxxx

**Errores:**
- `400 Bad Request`: Archivo no válido
- `413 Payload Too Large`: Archivo demasiado grande

```json
{
  "error": "El archivo excede el tamaño máximo permitido (10MB)"
}
```

---

### Exportación

#### GET /export/patients

Exportar pacientes a archivo XLSX.

**Query Parameters:**
- `diagnostico` (string): Filtrar por código ORPHA
- `nhc` (string): Filtrar por NHC específico
- `fecha_desde` (date): Filtrar desde fecha (YYYY-MM-DD)
- `fecha_hasta` (date): Filtrar hasta fecha (YYYY-MM-DD)

**Ejemplos:**

**1. Exportar todos:**
```http
GET /api/export/patients
Authorization: Bearer <token>
```

**2. Exportar por diagnóstico:**
```http
GET /api/export/patients?diagnostico=ORPHA123
Authorization: Bearer <token>
```

**3. Exportar rango de fechas:**
```http
GET /api/export/patients?fecha_desde=2024-01-01&fecha_hasta=2024-12-31
Authorization: Bearer <token>
```

**Response (200 OK):**
```
Content-Type: application/vnd.openxmlformats-officedocument.spreadsheetml.sheet
Content-Disposition: attachment; filename="pacientes_2024-11-18.xlsx"

[Binary XLSX file]
```

**Estructura del archivo XLSX:**
| NHC   | Diagnósticos      | Fecha Último Seguimiento |
|-------|-------------------|--------------------------|
| 12345 | ORPHA123,ORPHA456 | 2024-05-15              |
| 67890 | ORPHA789          | 2024-06-20              |

---

## Códigos de Estado HTTP

| Código | Descripción |
|--------|-------------|
| 200 | OK - Solicitud exitosa |
| 201 | Created - Recurso creado |
| 400 | Bad Request - Datos inválidos |
| 401 | Unauthorized - No autenticado |
| 403 | Forbidden - Sin permisos |
| 404 | Not Found - Recurso no encontrado |
| 409 | Conflict - Conflicto (ej. username duplicado) |
| 413 | Payload Too Large - Archivo muy grande |
| 500 | Internal Server Error - Error del servidor |

---

## Formato de Errores

Todos los errores siguen este formato:

```json
{
  "error": "Mensaje descriptivo del error",
  "code": "ERROR_CODE",
  "field": "campo_afectado",
  "details": {}
}
```

**Ejemplos:**

**Validación:**
```json
{
  "error": "El campo username es requerido",
  "code": "VALIDATION_ERROR",
  "field": "username"
}
```

**Autenticación:**
```json
{
  "error": "Token inválido o expirado",
  "code": "AUTH_ERROR"
}
```

**Autorización:**
```json
{
  "error": "No tiene permisos para realizar esta acción",
  "code": "FORBIDDEN",
  "required_role": "admin"
}
```

---

## Rate Limiting

**Límites (para prevenir abuso):**
- Endpoints de autenticación: 5 intentos/minuto por IP
- Importación: 1 archivo cada 5 minutos por usuario
- Otros endpoints: 100 requests/minuto por usuario

**Response cuando se excede:**
```http
HTTP/1.1 429 Too Many Requests
Retry-After: 60

{
  "error": "Demasiadas solicitudes. Intente de nuevo en 60 segundos",
  "code": "RATE_LIMIT_EXCEEDED"
}
```

---

## Versionado de API

Actualmente: **v1** (implícito en /api)

Futuro: `/api/v2/...` para cambios incompatibles

---

## Testing de la API

### Con cURL

**Login:**
```bash
curl -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Hospital2024!"}'
```

**Buscar paciente (con token):**
```bash
TOKEN="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9..."

curl -X GET http://localhost:3000/api/patients/12345 \
  -H "Authorization: Bearer $TOKEN"
```

**Importar archivo:**
```bash
curl -X POST http://localhost:3000/api/import \
  -H "Authorization: Bearer $TOKEN" \
  -F "file=@/path/to/pacientes.csv"
```

### Con Postman

1. Crear colección "Patient Tracking System"
2. Configurar variable de entorno `BASE_URL` = http://localhost:3000/api
3. Crear request de login, guardar token en variable
4. Usar `{{token}}` en headers de otros requests

**Collection compartida:** `/docs/postman_collection.json` (incluida en repo)

---

## Ejemplos de Integración

### JavaScript (Axios)

```javascript
import axios from 'axios';

const api = axios.create({
  baseURL: 'http://localhost:3000/api',
});

// Interceptor para añadir token
api.interceptors.request.use(config => {
  const token = localStorage.getItem('token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Login
async function login(username, password) {
  const response = await api.post('/auth/login', { username, password });
  localStorage.setItem('token', response.data.token);
  return response.data.user;
}

// Buscar paciente
async function getPatient(nhc) {
  const response = await api.get(`/patients/${nhc}`);
  return response.data;
}

// Importar archivo
async function importFile(file) {
  const formData = new FormData();
  formData.append('file', file);
  const response = await api.post('/import', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return response.data;
}
```

---

## Notas de Seguridad

1. **HTTPS en Producción**: Siempre usar HTTPS para prevenir interceptación de tokens
2. **Tokens**: No compartir tokens JWT, tienen toda la información de sesión
3. **Contraseñas**: Nunca enviar contraseñas en URLs o logs
4. **CORS**: Configurado solo para frontend autorizado
5. **Validación**: Todos los inputs son validados server-side

---

## Changelog

### v1.0.0 (2024-11-18)
- Versión inicial
- Autenticación JWT
- CRUD de usuarios
- Búsqueda de pacientes
- Importación CSV/XLSX
- Exportación XLSX
- Estadísticas básicas
