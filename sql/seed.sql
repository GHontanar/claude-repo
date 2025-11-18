-- =====================================================
-- Patient Tracking System - Seed Data
-- Version: 1.0.0
-- Description: Datos de ejemplo para testing y desarrollo
-- =====================================================

USE hospital_patients;

-- =====================================================
-- Usuarios de prueba
-- =====================================================

-- Usuario admin (ya existe en schema.sql)
-- Username: admin
-- Password: Hospital2024!

-- Usuarios médicos de prueba
-- Password para todos: Test1234!
INSERT INTO usuarios (username, password, rol) VALUES
('medico1', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZZ5v9F0g0Ey6G6E0K8YPe', 'usuario'),
('medico2', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZZ5v9F0g0Ey6G6E0K8YPe', 'usuario'),
('admin2', '$2b$10$EixZaYVK1fsbw1ZfbX3OXePaWxn96p36ZZ5v9F0g0Ey6G6E0K8YPe', 'admin')
ON DUPLICATE KEY UPDATE username=username;

-- =====================================================
-- Pacientes de prueba
-- =====================================================

INSERT INTO pacientes (nhc, diagnosticos, fecha_ultimo_seguimiento) VALUES
-- Paciente con múltiples diagnósticos
('12345', '["ORPHA123", "ORPHA456"]', '2024-05-15'),

-- Paciente con un solo diagnóstico
('67890', '["ORPHA789"]', '2024-06-20'),

-- Paciente sin seguimiento reciente (>1 año)
('11111', '["ORPHA123", "ORPHA999"]', '2023-01-10'),

-- Paciente con seguimiento reciente
('22222', '["ORPHA456"]', '2024-11-01'),

-- Paciente con tres diagnósticos
('33333', '["ORPHA123", "ORPHA456", "ORPHA789"]', '2024-08-15'),

-- Más pacientes para testing de búsquedas
('44444', '["ORPHA999"]', '2024-07-20'),
('55555', '["ORPHA123"]', '2024-09-10'),
('66666', '["ORPHA789", "ORPHA999"]', '2024-10-05'),
('77777', '["ORPHA456"]', '2024-03-15'),
('88888', '["ORPHA123", "ORPHA789"]', '2024-11-10')
ON DUPLICATE KEY UPDATE nhc=nhc;

-- =====================================================
-- Estadísticas de datos insertados
-- =====================================================

-- Verificar inserción
SELECT 'Usuarios insertados:' AS Info, COUNT(*) AS Total FROM usuarios;
SELECT 'Pacientes insertados:' AS Info, COUNT(*) AS Total FROM pacientes;

-- Top diagnósticos
SELECT 'Top 3 diagnósticos:' AS Info;
SELECT
  diag AS Codigo,
  COUNT(*) AS Cantidad_Pacientes
FROM pacientes,
JSON_TABLE(diagnosticos, '$[*]' COLUMNS(diag VARCHAR(20) PATH '$')) AS jt
GROUP BY diag
ORDER BY Cantidad_Pacientes DESC
LIMIT 3;

-- =====================================================
-- Fin del seed
-- =====================================================
