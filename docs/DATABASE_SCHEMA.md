# Database Schema - Patient Tracking System

## Índice
1. [Modelo Entidad-Relación](#modelo-entidad-relación)
2. [Tablas](#tablas)
3. [Índices](#índices)
4. [Constraints](#constraints)
5. [Queries Comunes](#queries-comunes)
6. [Migraciones](#migraciones)
7. [Backup y Restore](#backup-y-restore)

---

## Modelo Entidad-Relación

```
┌─────────────────────┐
│      USUARIOS       │
├─────────────────────┤
│ id (PK)             │
│ username (UNIQUE)   │
│ password            │
│ rol                 │
│ created_at          │
│ updated_at          │
└─────────────────────┘

        (No hay relación directa)

┌─────────────────────┐
│     PACIENTES       │
├─────────────────────┤
│ nhc (PK)            │
│ diagnosticos (JSON) │
│ fecha_ultimo_seg    │
│ created_at          │
│ updated_at          │
└─────────────────────┘
```

**Diseño sin relaciones:**
- Tablas independientes (usuarios no "poseen" pacientes)
- Simplicidad y performance
- Auditoría a nivel de aplicación (no DB)

---

## Tablas

### 1. Tabla: `usuarios`

Almacena usuarios del sistema con sus credenciales y roles.

```sql
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID único del usuario',
  username VARCHAR(50) NOT NULL UNIQUE COMMENT 'Nombre de usuario para login',
  password VARCHAR(255) NOT NULL COMMENT 'Hash bcrypt de la contraseña',
  rol ENUM('admin', 'usuario') NOT NULL DEFAULT 'usuario' COMMENT 'Rol: admin o usuario',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última actualización'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Descripción de campos:**

| Campo | Tipo | Descripción | Validación |
|-------|------|-------------|------------|
| `id` | INT | Identificador único auto-incremental | PK, NOT NULL |
| `username` | VARCHAR(50) | Nombre de usuario único | UNIQUE, 3-50 chars |
| `password` | VARCHAR(255) | Hash bcrypt (60 chars típico, 255 por futuro) | NOT NULL |
| `rol` | ENUM | Rol del usuario: 'admin' o 'usuario' | NOT NULL, DEFAULT 'usuario' |
| `created_at` | TIMESTAMP | Fecha y hora de creación del usuario | AUTO |
| `updated_at` | TIMESTAMP | Última modificación del registro | AUTO UPDATE |

**Ejemplo de registro:**
```sql
id: 1
username: 'admin'
password: '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy'
rol: 'admin'
created_at: '2024-01-15 10:30:00'
updated_at: '2024-01-15 10:30:00'
```

---

### 2. Tabla: `pacientes`

Almacena información de pacientes en seguimiento.

```sql
CREATE TABLE pacientes (
  nhc VARCHAR(50) PRIMARY KEY COMMENT 'Número de Historia Clínica (único)',
  diagnosticos JSON NOT NULL COMMENT 'Array JSON de códigos ORPHA',
  fecha_ultimo_seguimiento DATE NOT NULL COMMENT 'Fecha de la última consulta',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación del registro',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última actualización',
  CONSTRAINT chk_diagnosticos_not_empty CHECK (JSON_LENGTH(diagnosticos) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
```

**Descripción de campos:**

| Campo | Tipo | Descripción | Validación |
|-------|------|-------------|------------|
| `nhc` | VARCHAR(50) | Número de Historia Clínica del paciente | PK, NOT NULL |
| `diagnosticos` | JSON | Array de códigos ORPHA (enfermedades raras) | NOT NULL, length > 0 |
| `fecha_ultimo_seguimiento` | DATE | Fecha de la última consulta del paciente | NOT NULL |
| `created_at` | TIMESTAMP | Fecha de creación del registro | AUTO |
| `updated_at` | TIMESTAMP | Última modificación del registro | AUTO UPDATE |

**Ejemplo de registro:**
```sql
nhc: '12345'
diagnosticos: '["ORPHA123", "ORPHA456", "ORPHA789"]'
fecha_ultimo_seguimiento: '2024-05-15'
created_at: '2023-01-10 08:00:00'
updated_at: '2024-05-16 12:30:00'
```

**Estructura del campo JSON `diagnosticos`:**
```json
["ORPHA123", "ORPHA456", "ORPHA789"]
```

**Ventajas del tipo JSON:**
- Número flexible de diagnósticos por paciente
- Búsquedas eficientes con funciones JSON de MySQL
- No requiere tabla de relación adicional
- Fácil añadir/eliminar diagnósticos

---

## Índices

Los índices mejoran significativamente el rendimiento de las búsquedas.

### Índices en `usuarios`

```sql
-- Índice único en username (creado automáticamente por UNIQUE)
CREATE UNIQUE INDEX idx_username ON usuarios(username);
```

**Uso:**
- Login: búsqueda por username
- Validación de username único al crear usuario

**Performance:**
- Sin índice: O(n) - escaneo completo
- Con índice: O(log n) - búsqueda binaria

---

### Índices en `pacientes`

```sql
-- Índice en fecha_ultimo_seguimiento para ordenamiento
CREATE INDEX idx_fecha ON pacientes(fecha_ultimo_seguimiento);

-- Índice multi-valor en diagnosticos para búsquedas JSON (MySQL 8.0.17+)
CREATE INDEX idx_diagnosticos ON pacientes((CAST(diagnosticos AS CHAR(1000) ARRAY)));
```

**Uso:**
- `idx_fecha`: Ordenar por fecha, filtrar por rangos de fechas
- `idx_diagnosticos`: Buscar pacientes por código ORPHA específico

**Ejemplo de query optimizado:**
```sql
-- SIN índice: Full table scan
-- CON índice: Index range scan
SELECT * FROM pacientes
WHERE JSON_CONTAINS(diagnosticos, '"ORPHA123"')
ORDER BY fecha_ultimo_seguimiento DESC;
```

---

## Constraints

### Primary Keys

```sql
-- usuarios
PRIMARY KEY (id)

-- pacientes
PRIMARY KEY (nhc)
```

### Unique Constraints

```sql
-- usuarios: username debe ser único
UNIQUE KEY idx_username (username)
```

### Check Constraints

```sql
-- pacientes: diagnosticos no puede estar vacío
CONSTRAINT chk_diagnosticos_not_empty
CHECK (JSON_LENGTH(diagnosticos) > 0)
```

### NOT NULL Constraints

```sql
-- usuarios
username VARCHAR(50) NOT NULL
password VARCHAR(255) NOT NULL
rol ENUM('admin', 'usuario') NOT NULL

-- pacientes
diagnosticos JSON NOT NULL
fecha_ultimo_seguimiento DATE NOT NULL
```

---

## Queries Comunes

### Usuarios

**1. Login - Buscar usuario por username:**
```sql
SELECT id, username, password, rol
FROM usuarios
WHERE username = ?;
```

**2. Listar todos los usuarios (sin contraseñas):**
```sql
SELECT id, username, rol, created_at, updated_at
FROM usuarios
ORDER BY created_at DESC;
```

**3. Crear usuario:**
```sql
INSERT INTO usuarios (username, password, rol)
VALUES (?, ?, ?);
```

**4. Cambiar contraseña:**
```sql
UPDATE usuarios
SET password = ?, updated_at = CURRENT_TIMESTAMP
WHERE id = ?;
```

**5. Eliminar usuario:**
```sql
DELETE FROM usuarios WHERE id = ?;
```

**6. Contar administradores (validar antes de eliminar):**
```sql
SELECT COUNT(*) as admin_count
FROM usuarios
WHERE rol = 'admin';
```

---

### Pacientes

**1. Buscar por NHC:**
```sql
SELECT nhc, diagnosticos, fecha_ultimo_seguimiento, created_at, updated_at
FROM pacientes
WHERE nhc = ?;
```

**2. Buscar por diagnóstico específico:**
```sql
SELECT nhc, diagnosticos, fecha_ultimo_seguimiento
FROM pacientes
WHERE JSON_CONTAINS(diagnosticos, JSON_QUOTE(?))
ORDER BY fecha_ultimo_seguimiento DESC;
```

**Ejemplo:**
```sql
SELECT nhc, diagnosticos, fecha_ultimo_seguimiento
FROM pacientes
WHERE JSON_CONTAINS(diagnosticos, '"ORPHA123"')
ORDER BY fecha_ultimo_seguimiento DESC;
```

**3. Listar todos los pacientes (paginado):**
```sql
SELECT nhc, diagnosticos, fecha_ultimo_seguimiento
FROM pacientes
ORDER BY fecha_ultimo_seguimiento DESC
LIMIT ? OFFSET ?;
```

**4. Contar total de pacientes:**
```sql
SELECT COUNT(*) as total FROM pacientes;
```

**5. Crear nuevo paciente:**
```sql
INSERT INTO pacientes (nhc, diagnosticos, fecha_ultimo_seguimiento)
VALUES (?, ?, ?);
```

**6. Actualizar paciente existente:**
```sql
UPDATE pacientes
SET
  diagnosticos = ?,
  fecha_ultimo_seguimiento = ?,
  updated_at = CURRENT_TIMESTAMP
WHERE nhc = ?;
```

**7. Obtener diagnósticos únicos:**
```sql
SELECT DISTINCT JSON_UNQUOTE(JSON_EXTRACT(diagnosticos, CONCAT('$[', idx, ']'))) as codigo
FROM pacientes,
JSON_TABLE(
  JSON_ARRAY_ELEMENTS(diagnosticos),
  '$[*]' COLUMNS(idx FOR ORDINALITY)
) AS jt;
```

**Simplificado (MySQL 8.0+):**
```sql
SELECT DISTINCT diag
FROM pacientes,
JSON_TABLE(diagnosticos, '$[*]' COLUMNS(diag VARCHAR(20) PATH '$')) AS jt;
```

**8. Top 10 diagnósticos más frecuentes:**
```sql
SELECT
  diag as codigo,
  COUNT(*) as count
FROM pacientes,
JSON_TABLE(diagnosticos, '$[*]' COLUMNS(diag VARCHAR(20) PATH '$')) AS jt
GROUP BY diag
ORDER BY count DESC
LIMIT 10;
```

**9. Pacientes sin seguimiento reciente (>1 año):**
```sql
SELECT nhc, diagnosticos, fecha_ultimo_seguimiento
FROM pacientes
WHERE fecha_ultimo_seguimiento < DATE_SUB(CURDATE(), INTERVAL 1 YEAR)
ORDER BY fecha_ultimo_seguimiento ASC;
```

**10. Buscar por rango de fechas:**
```sql
SELECT nhc, diagnosticos, fecha_ultimo_seguimiento
FROM pacientes
WHERE fecha_ultimo_seguimiento BETWEEN ? AND ?
ORDER BY fecha_ultimo_seguimiento DESC;
```

---

### Combinación de Diagnósticos (Lógica de Importación)

**Obtener diagnósticos actuales de un paciente:**
```sql
SELECT diagnosticos
FROM pacientes
WHERE nhc = ?;
```

**Actualizar con diagnósticos combinados:**
```javascript
// En aplicación (Node.js)
const current = ['ORPHA123', 'ORPHA456'];
const new = ['ORPHA456', 'ORPHA789'];
const merged = [...new Set([...current, ...new])];
// merged = ['ORPHA123', 'ORPHA456', 'ORPHA789']

// Actualizar en DB
UPDATE pacientes
SET diagnosticos = '["ORPHA123","ORPHA456","ORPHA789"]',
    fecha_ultimo_seguimiento = '2024-11-18'
WHERE nhc = '12345';
```

---

## Migraciones

### Versión 1.0.0 - Schema Inicial

**Archivo:** `sql/migrations/001_initial_schema.sql`

```sql
-- Crear base de datos
CREATE DATABASE IF NOT EXISTS hospital_patients
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE hospital_patients;

-- Tabla usuarios
CREATE TABLE usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY,
  username VARCHAR(50) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  rol ENUM('admin', 'usuario') NOT NULL DEFAULT 'usuario',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Tabla pacientes
CREATE TABLE pacientes (
  nhc VARCHAR(50) PRIMARY KEY,
  diagnosticos JSON NOT NULL,
  fecha_ultimo_seguimiento DATE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT chk_diagnosticos_not_empty CHECK (JSON_LENGTH(diagnosticos) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Índices
CREATE INDEX idx_fecha ON pacientes(fecha_ultimo_seguimiento);
CREATE INDEX idx_diagnosticos ON pacientes((CAST(diagnosticos AS CHAR(1000) ARRAY)));

-- Usuario admin por defecto (password: Hospital2024!)
INSERT INTO usuarios (username, password, rol) VALUES
('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin');
```

---

### Futuras Migraciones

**Estructura de archivos:**
```
sql/migrations/
├── 001_initial_schema.sql
├── 002_add_user_email.sql        (futuro)
├── 003_add_patient_status.sql    (futuro)
└── migration_history.sql
```

**Tabla de control de migraciones:**
```sql
CREATE TABLE migration_history (
  id INT AUTO_INCREMENT PRIMARY KEY,
  version VARCHAR(20) NOT NULL,
  description VARCHAR(255) NOT NULL,
  executed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
```

---

## Backup y Restore

### Backup Completo

```bash
# Backup de toda la base de datos
mysqldump -u root -p hospital_patients > backup_$(date +%Y%m%d_%H%M%S).sql

# Backup solo de la estructura
mysqldump -u root -p --no-data hospital_patients > schema_backup.sql

# Backup solo de los datos
mysqldump -u root -p --no-create-info hospital_patients > data_backup.sql

# Backup comprimido
mysqldump -u root -p hospital_patients | gzip > backup_$(date +%Y%m%d).sql.gz
```

### Restore

```bash
# Restore completo
mysql -u root -p hospital_patients < backup_20241118_120000.sql

# Restore desde archivo comprimido
gunzip < backup_20241118.sql.gz | mysql -u root -p hospital_patients
```

### Backup Automático (Cron Job)

```bash
# Editar crontab
crontab -e

# Backup diario a las 2 AM
0 2 * * * /usr/bin/mysqldump -u backup_user -p'password' hospital_patients | gzip > /backups/hospital_$(date +\%Y\%m\%d).sql.gz

# Mantener solo últimos 30 días
0 3 * * * find /backups -name "hospital_*.sql.gz" -mtime +30 -delete
```

---

## Performance y Optimización

### Configuración MySQL Recomendada

```ini
# my.cnf / my.ini
[mysqld]
# Memoria
innodb_buffer_pool_size = 1G        # 70-80% de RAM disponible
innodb_log_file_size = 256M

# Conexiones
max_connections = 100
wait_timeout = 300

# Charset
character-set-server = utf8mb4
collation-server = utf8mb4_unicode_ci

# Performance
innodb_flush_log_at_trx_commit = 2
innodb_flush_method = O_DIRECT
```

### Monitoreo de Performance

```sql
-- Ver queries lentas
SELECT * FROM information_schema.processlist
WHERE command != 'Sleep'
ORDER BY time DESC;

-- Tamaño de tablas
SELECT
  table_name,
  ROUND(((data_length + index_length) / 1024 / 1024), 2) AS 'Size (MB)'
FROM information_schema.tables
WHERE table_schema = 'hospital_patients'
ORDER BY (data_length + index_length) DESC;

-- Uso de índices
SHOW INDEX FROM pacientes;

-- Analizar query
EXPLAIN SELECT * FROM pacientes
WHERE JSON_CONTAINS(diagnosticos, '"ORPHA123"');
```

---

## Mantenimiento

### Optimizar Tablas

```sql
-- Analizar tabla (actualizar estadísticas)
ANALYZE TABLE pacientes;

-- Optimizar tabla (reorganizar datos)
OPTIMIZE TABLE pacientes;

-- Reparar tabla (si hay corrupción)
REPAIR TABLE pacientes;
```

### Limpieza

```sql
-- Eliminar pacientes antiguos (si aplica política de retención)
DELETE FROM pacientes
WHERE fecha_ultimo_seguimiento < DATE_SUB(CURDATE(), INTERVAL 10 YEAR);

-- Eliminar usuarios inactivos (opcional)
DELETE FROM usuarios
WHERE updated_at < DATE_SUB(CURDATE(), INTERVAL 2 YEAR)
  AND rol = 'usuario';
```

---

## Seguridad de Base de Datos

### Usuarios de MySQL

```sql
-- Crear usuario para la aplicación (solo permisos necesarios)
CREATE USER 'hospital_app'@'localhost' IDENTIFIED BY 'SecurePassword123!';

-- Permisos mínimos necesarios
GRANT SELECT, INSERT, UPDATE, DELETE ON hospital_patients.* TO 'hospital_app'@'localhost';

-- Usuario para backups (solo lectura)
CREATE USER 'backup_user'@'localhost' IDENTIFIED BY 'BackupPass456!';
GRANT SELECT, LOCK TABLES ON hospital_patients.* TO 'backup_user'@'localhost';

-- Aplicar cambios
FLUSH PRIVILEGES;
```

### No usar root en producción

❌ **Nunca:**
```javascript
// backend/config/database.js
user: 'root'  // MAL
```

✅ **Siempre:**
```javascript
// backend/config/database.js
user: 'hospital_app'  // BIEN
```

---

## Datos de Ejemplo (Testing)

```sql
-- Insertar usuarios de prueba
INSERT INTO usuarios (username, password, rol) VALUES
('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin'),
('medico1', '$2b$10$abcdefghijklmnopqrstuvwxyz123456789', 'usuario'),
('medico2', '$2b$10$abcdefghijklmnopqrstuvwxyz123456789', 'usuario');

-- Insertar pacientes de prueba
INSERT INTO pacientes (nhc, diagnosticos, fecha_ultimo_seguimiento) VALUES
('12345', '["ORPHA123", "ORPHA456"]', '2024-05-15'),
('67890', '["ORPHA789"]', '2024-06-20'),
('11111', '["ORPHA123", "ORPHA999"]', '2023-01-10'),
('22222', '["ORPHA456"]', '2024-11-01');
```

---

## FAQ

**Q: ¿Por qué usar JSON para diagnósticos en lugar de una tabla de relación?**
A: Simplicidad y performance. El número de diagnósticos por paciente es pequeño (1-5 típicamente), las búsquedas JSON en MySQL 8.0+ son eficientes, y evita JOINs complejos.

**Q: ¿Qué pasa si MySQL no soporta índices multi-valor (versión < 8.0.17)?**
A: Funcionará sin índice en diagnosticos, pero las búsquedas serán más lentas. Considerar actualizar MySQL o crear tabla normalizada.

**Q: ¿Cómo manejar caracteres especiales en NHC?**
A: VARCHAR con collation utf8mb4_unicode_ci soporta caracteres especiales. Validar en aplicación.

**Q: ¿Necesitamos auditoría de cambios?**
A: Los campos `created_at` y `updated_at` proveen auditoría básica. Para auditoría completa, considerar tabla de logs o triggers.

---

## Conclusión

Este esquema proporciona:
- ✅ Simplicidad de diseño
- ✅ Performance optimizado
- ✅ Flexibilidad para diagnósticos múltiples
- ✅ Seguridad con constraints
- ✅ Escalabilidad para 10K-100K pacientes

Para más información, consultar la documentación de MySQL 8.0 sobre tipos JSON.
