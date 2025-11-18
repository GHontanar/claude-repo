# Development Guide - Patient Tracking System

## Índice
1. [Configuración del Entorno](#configuración-del-entorno)
2. [Estructura del Proyecto](#estructura-del-proyecto)
3. [Flujo de Desarrollo](#flujo-de-desarrollo)
4. [Estándares de Código](#estándares-de-código)
5. [Testing](#testing)
6. [Debugging](#debugging)
7. [Git Workflow](#git-workflow)

---

## Configuración del Entorno

### Requisitos Previos

- **Node.js**: v18.x o superior
- **npm**: v9.x o superior
- **MySQL**: v8.0 o superior
- **Git**: v2.x o superior
- **Editor**: VSCode (recomendado) o similar

### Verificar Instalaciones

```bash
node --version    # v18.x+
npm --version     # v9.x+
mysql --version   # v8.0+
git --version     # v2.x+
```

---

## Instalación Inicial

### 1. Clonar el Repositorio

```bash
git clone git@github.com:GHontanar/claude-repo.git
cd claude-repo
```

### 2. Configurar MySQL

```bash
# Iniciar MySQL
sudo systemctl start mysql  # Linux
# o
brew services start mysql   # macOS

# Acceder a MySQL
mysql -u root -p

# Crear base de datos y usuario
CREATE DATABASE hospital_patients CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
CREATE USER 'hospital_app'@'localhost' IDENTIFIED BY 'tu_password_seguro';
GRANT ALL PRIVILEGES ON hospital_patients.* TO 'hospital_app'@'localhost';
FLUSH PRIVILEGES;
EXIT;

# Ejecutar schema
mysql -u root -p hospital_patients < sql/schema.sql
```

### 3. Configurar Backend

```bash
cd backend
npm install

# Copiar variables de entorno
cp .env.example .env

# Editar .env con tus valores
nano .env
```

**Contenido de `.env`:**
```bash
# Database
DB_HOST=localhost
DB_USER=hospital_app
DB_PASSWORD=tu_password_seguro
DB_NAME=hospital_patients

# JWT
JWT_SECRET=genera_un_secreto_largo_y_aleatorio_aqui

# Server
PORT=3000
NODE_ENV=development

# CORS
FRONTEND_URL=http://localhost:5173
```

**Generar JWT_SECRET seguro:**
```bash
node -e "console.log(require('crypto').randomBytes(64).toString('hex'))"
```

### 4. Configurar Frontend

```bash
cd ../frontend
npm install

# Copiar variables de entorno
cp .env.example .env

# Editar .env
nano .env
```

**Contenido de `.env`:**
```bash
VITE_API_URL=http://localhost:3000/api
```

---

## Estructura del Proyecto

```
claude-repo/
├── backend/                      # Node.js/Express API
│   ├── config/
│   │   └── database.js          # Configuración MySQL
│   ├── middleware/
│   │   ├── auth.js              # Middleware de autenticación
│   │   ├── roleCheck.js         # Verificación de roles
│   │   └── validation.js        # Validación de datos
│   ├── routes/
│   │   ├── auth.js              # Rutas de autenticación
│   │   ├── users.js             # Rutas de usuarios
│   │   ├── patients.js          # Rutas de pacientes
│   │   ├── import.js            # Importación de datos
│   │   └── export.js            # Exportación de datos
│   ├── controllers/
│   │   ├── authController.js    # Lógica de autenticación
│   │   ├── userController.js    # Lógica de usuarios
│   │   ├── patientController.js # Lógica de pacientes
│   │   ├── importController.js  # Lógica de importación
│   │   └── exportController.js  # Lógica de exportación
│   ├── models/
│   │   ├── User.js              # Modelo de usuario
│   │   └── Patient.js           # Modelo de paciente
│   ├── utils/
│   │   ├── csvParser.js         # Parser CSV/XLSX
│   │   ├── xlsxGenerator.js     # Generador XLSX
│   │   └── validators.js        # Funciones de validación
│   ├── server.js                # Punto de entrada
│   ├── package.json
│   └── .env.example
│
├── frontend/                     # React Application
│   ├── src/
│   │   ├── components/
│   │   │   ├── Auth/
│   │   │   │   ├── Login.jsx
│   │   │   │   └── ProtectedRoute.jsx
│   │   │   ├── Admin/
│   │   │   │   ├── ImportData.jsx
│   │   │   │   └── UserManagement.jsx
│   │   │   ├── Search/
│   │   │   │   ├── SearchByNHC.jsx
│   │   │   │   ├── SearchByDiagnosis.jsx
│   │   │   │   └── PatientList.jsx
│   │   │   ├── Stats/
│   │   │   │   └── Dashboard.jsx
│   │   │   └── Common/
│   │   │       ├── Navbar.jsx
│   │   │       └── ExportButton.jsx
│   │   ├── contexts/
│   │   │   └── AuthContext.jsx
│   │   ├── services/
│   │   │   └── api.js
│   │   ├── App.jsx
│   │   ├── main.jsx
│   │   └── index.css
│   ├── public/
│   ├── package.json
│   ├── vite.config.js
│   └── .env.example
│
├── sql/                          # Scripts SQL
│   ├── schema.sql               # Creación de tablas
│   └── seed.sql                 # Datos de prueba
│
├── docs/                         # Documentación
│   ├── ARCHITECTURE.md
│   ├── API_DOCUMENTATION.md
│   ├── DATABASE_SCHEMA.md
│   ├── DEVELOPMENT.md (este archivo)
│   └── DEPLOYMENT.md
│
├── .gitignore
└── README.md
```

---

## Flujo de Desarrollo

### Iniciar Servidores de Desarrollo

**Terminal 1 - Backend:**
```bash
cd backend
npm run dev    # Usa nodemon para auto-reload
```

**Terminal 2 - Frontend:**
```bash
cd frontend
npm run dev    # Vite dev server con HMR
```

**Acceder a la aplicación:**
- Frontend: http://localhost:5173
- Backend API: http://localhost:3000/api
- Login por defecto: `admin` / `Hospital2024!`

---

### Workflow Típico de Desarrollo

#### 1. Crear Nueva Feature

```bash
# Crear rama desde main
git checkout -b feature/nombre-feature

# Hacer cambios...

# Commit
git add .
git commit -m "feat: descripción de la feature"

# Push
git push origin feature/nombre-feature
```

#### 2. Añadir Nuevo Endpoint (Backend)

**Paso 1: Crear ruta**
```javascript
// backend/routes/nuevaRuta.js
const express = require('express');
const router = express.Router();
const { verifyToken } = require('../middleware/auth');
const controller = require('../controllers/nuevoController');

router.get('/', verifyToken, controller.getAll);
router.post('/', verifyToken, controller.create);

module.exports = router;
```

**Paso 2: Crear controlador**
```javascript
// backend/controllers/nuevoController.js
const Model = require('../models/NuevoModel');

exports.getAll = async (req, res) => {
  try {
    const data = await Model.findAll();
    res.json(data);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
};
```

**Paso 3: Crear modelo**
```javascript
// backend/models/NuevoModel.js
const pool = require('../config/database');

class NuevoModel {
  static async findAll() {
    const [rows] = await pool.execute('SELECT * FROM tabla');
    return rows;
  }
}

module.exports = NuevoModel;
```

**Paso 4: Registrar ruta en server.js**
```javascript
// backend/server.js
const nuevaRuta = require('./routes/nuevaRuta');
app.use('/api/nueva-ruta', nuevaRuta);
```

#### 3. Añadir Nuevo Componente (Frontend)

**Paso 1: Crear componente**
```jsx
// frontend/src/components/NuevoComponente.jsx
import { useState, useEffect } from 'react';
import api from '../services/api';

export default function NuevoComponente() {
  const [data, setData] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const response = await api.get('/nueva-ruta');
      setData(response.data);
    };
    fetchData();
  }, []);

  return (
    <div>
      {/* JSX aquí */}
    </div>
  );
}
```

**Paso 2: Añadir ruta**
```jsx
// frontend/src/App.jsx
import NuevoComponente from './components/NuevoComponente';

// En el Router
<Route path="/nuevo" element={
  <ProtectedRoute>
    <NuevoComponente />
  </ProtectedRoute>
} />
```

---

## Estándares de Código

### JavaScript/JSX

**Estilo:**
- **Indentación**: 2 espacios
- **Comillas**: Simples para JS, dobles para JSX props
- **Semicolons**: Usar siempre
- **Nombres**: camelCase para variables/funciones, PascalCase para componentes

**Ejemplo:**
```javascript
// ✅ BIEN
const getUserData = async (userId) => {
  const response = await api.get(`/users/${userId}`);
  return response.data;
};

// ❌ MAL
const get_user_data = async (userId) => {
    const response = await api.get(`/users/${userId}`)
    return response.data
}
```

### Convenciones de Nombres

| Tipo | Convención | Ejemplo |
|------|------------|---------|
| Archivo JS | camelCase | `userController.js` |
| Componente React | PascalCase | `SearchByNHC.jsx` |
| Variables | camelCase | `patientData` |
| Constantes | UPPER_SNAKE_CASE | `MAX_FILE_SIZE` |
| Funciones | camelCase | `processImport()` |
| Clases | PascalCase | `PatientModel` |

### Comentarios

```javascript
/**
 * Procesa la importación de un archivo CSV/XLSX
 * @param {Object} file - Archivo subido por el usuario
 * @returns {Object} Resumen de la importación
 */
async function processImport(file) {
  // Validar formato del archivo
  if (!isValidFormat(file)) {
    throw new Error('Formato inválido');
  }

  // Procesar línea por línea
  // ...
}
```

### ESLint (Opcional)

```bash
# Instalar ESLint
npm install --save-dev eslint

# Configurar
npx eslint --init
```

**.eslintrc.json:**
```json
{
  "env": {
    "node": true,
    "es2021": true
  },
  "extends": "eslint:recommended",
  "parserOptions": {
    "ecmaVersion": 12
  },
  "rules": {
    "indent": ["error", 2],
    "quotes": ["error", "single"],
    "semi": ["error", "always"]
  }
}
```

---

## Testing

### Testing Manual

**Archivo de prueba:** `test_data/pacientes_test.csv`
```csv
NHC,Diagnosticos,Fecha
TEST001,"ORPHA123,ORPHA456",2024-01-15
TEST002,"ORPHA789",2024-02-20
```

**Casos de prueba:**

1. **Login**
   - Usuario válido → OK
   - Usuario inválido → 401
   - Sin token → 401

2. **Importación**
   - Archivo CSV válido → Pacientes creados
   - Archivo duplicado → Pacientes actualizados
   - Archivo inválido → Error

3. **Búsqueda**
   - NHC existente → Retorna paciente
   - NHC inexistente → 404
   - Diagnóstico existente → Retorna lista

### Testing con cURL

```bash
# Login
TOKEN=$(curl -s -X POST http://localhost:3000/api/auth/login \
  -H "Content-Type: application/json" \
  -d '{"username":"admin","password":"Hospital2024!"}' \
  | jq -r '.token')

# Buscar paciente
curl -X GET http://localhost:3000/api/patients/12345 \
  -H "Authorization: Bearer $TOKEN"

# Listar usuarios
curl -X GET http://localhost:3000/api/users \
  -H "Authorization: Bearer $TOKEN"
```

### Testing Unitario (Futuro)

**Framework recomendado:** Jest

```bash
npm install --save-dev jest supertest
```

**Ejemplo de test:**
```javascript
// backend/__tests__/auth.test.js
const request = require('supertest');
const app = require('../server');

describe('POST /api/auth/login', () => {
  it('should login with valid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'Hospital2024!' });

    expect(res.statusCode).toBe(200);
    expect(res.body).toHaveProperty('token');
  });

  it('should reject invalid credentials', async () => {
    const res = await request(app)
      .post('/api/auth/login')
      .send({ username: 'admin', password: 'wrong' });

    expect(res.statusCode).toBe(401);
  });
});
```

---

## Debugging

### Backend (Node.js)

**Console.log básico:**
```javascript
console.log('User data:', userData);
console.error('Error occurred:', error);
```

**Debugger de Node.js:**
```bash
# Iniciar con inspector
node --inspect server.js

# En Chrome: chrome://inspect
```

**VSCode Launch Configuration:**
```json
// .vscode/launch.json
{
  "version": "0.2.0",
  "configurations": [
    {
      "type": "node",
      "request": "launch",
      "name": "Debug Backend",
      "program": "${workspaceFolder}/backend/server.js",
      "envFile": "${workspaceFolder}/backend/.env"
    }
  ]
}
```

### Frontend (React)

**React DevTools:**
- Instalar extensión de Chrome/Firefox
- Inspeccionar componentes y state

**Console en navegador:**
```javascript
console.log('Patient data:', patientData);
console.table(patients); // Mostrar arrays como tabla
```

**Breakpoints:**
- Agregar `debugger;` en el código
- Pausará ejecución en DevTools

---

## Git Workflow

### Convenciones de Commits

Usar [Conventional Commits](https://www.conventionalcommits.org/):

```
<type>(<scope>): <description>

[optional body]

[optional footer]
```

**Types:**
- `feat`: Nueva feature
- `fix`: Bug fix
- `docs`: Documentación
- `style`: Formato (no afecta código)
- `refactor`: Refactorización
- `test`: Tests
- `chore`: Mantenimiento

**Ejemplos:**
```bash
git commit -m "feat(auth): add JWT refresh token"
git commit -m "fix(import): handle empty CSV files"
git commit -m "docs: update API documentation"
git commit -m "refactor(patients): optimize search query"
```

### Branches

```
main              # Producción
├── develop       # Desarrollo
    ├── feature/user-management
    ├── feature/statistics-dashboard
    └── fix/import-bug
```

**Comandos:**
```bash
# Crear feature branch
git checkout -b feature/nombre

# Merge a develop
git checkout develop
git merge feature/nombre

# Merge a main (solo versiones estables)
git checkout main
git merge develop
git tag v1.0.0
```

---

## Troubleshooting

### Problemas Comunes

**1. Error de conexión a MySQL**
```
Error: connect ECONNREFUSED 127.0.0.1:3306
```
**Solución:**
```bash
# Verificar que MySQL está corriendo
sudo systemctl status mysql

# Iniciar MySQL
sudo systemctl start mysql

# Verificar credenciales en .env
```

**2. CORS Error en frontend**
```
Access to XMLHttpRequest blocked by CORS policy
```
**Solución:**
```javascript
// backend/server.js
app.use(cors({
  origin: 'http://localhost:5173', // Verificar URL correcta
  credentials: true
}));
```

**3. Token inválido**
```
Error: jwt malformed
```
**Solución:**
- Verificar que JWT_SECRET es el mismo en .env
- Hacer logout y login de nuevo
- Verificar formato del token en localStorage

**4. Module not found**
```
Error: Cannot find module 'express'
```
**Solución:**
```bash
# Reinstalar dependencias
rm -rf node_modules package-lock.json
npm install
```

---

## Herramientas Recomendadas

### Editor: VSCode

**Extensiones recomendadas:**
- ESLint
- Prettier
- ES7+ React/Redux/React-Native snippets
- MySQL (cweijan.vscode-mysql-client2)
- Thunder Client (testing de APIs)

### Base de Datos: MySQL Workbench

- Interfaz gráfica para MySQL
- Diseño de esquemas
- Query builder
- Administración de usuarios

### API Testing: Postman / Thunder Client

- Testing de endpoints
- Colecciones de requests
- Variables de entorno

---

## Recursos Adicionales

- [Node.js Documentation](https://nodejs.org/docs/)
- [Express.js Guide](https://expressjs.com/en/guide/routing.html)
- [React Documentation](https://react.dev/)
- [MySQL 8.0 Reference](https://dev.mysql.com/doc/refman/8.0/en/)
- [JWT Introduction](https://jwt.io/introduction)

---

## Contribuir al Proyecto

1. Fork del repositorio
2. Crear feature branch
3. Hacer commits siguiendo convenciones
4. Push a tu fork
5. Crear Pull Request con descripción detallada

---

## Contacto

Para dudas sobre el desarrollo, contactar al equipo de sistemas del hospital.
