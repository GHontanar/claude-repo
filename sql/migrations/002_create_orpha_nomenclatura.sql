-- =====================================================
-- Migración: Crear tabla de nomenclatura ORPHA
-- Descripción: Almacena ~9000 códigos ORPHA con sus nombres
-- Fuente: Orphacode.org (Orphadata)
-- Fecha: 2024-11-19
-- =====================================================

USE hospital_patients;

-- =====================================================
-- Tabla: orpha_nomenclatura
-- Descripción: Nomenclador completo de enfermedades raras ORPHA
-- =====================================================

CREATE TABLE IF NOT EXISTS orpha_nomenclatura (
  code VARCHAR(20) PRIMARY KEY COMMENT 'Código ORPHA (formato: ORPHA.123)',
  nombre VARCHAR(500) NOT NULL COMMENT 'Nombre de la enfermedad en español',
  nombre_cientifico VARCHAR(500) DEFAULT NULL COMMENT 'Nombre científico/alternativo (opcional)',
  grupo_clinico VARCHAR(200) DEFAULT NULL COMMENT 'Grupo clínico o especialidad (futuro uso)',
  es_activo BOOLEAN DEFAULT TRUE COMMENT 'TRUE si el código está activo, FALSE si está obsoleto',
  fuente VARCHAR(50) DEFAULT 'Orphanet' COMMENT 'Fuente de datos: Orphanet, Sistema',
  version_orphanet VARCHAR(20) DEFAULT NULL COMMENT 'Versión de Orphanet (ej: 2024-12)',
  fecha_actualizacion TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última actualización del registro',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación del registro',

  -- Índices para optimizar búsquedas
  INDEX idx_nombre (nombre) COMMENT 'Índice para búsquedas por nombre',
  FULLTEXT INDEX idx_busqueda_texto (nombre, code) COMMENT 'Índice de texto completo para autocomplete',
  INDEX idx_activo (es_activo) COMMENT 'Filtrar códigos activos/obsoletos'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
COMMENT='Nomenclador completo de códigos ORPHA (~9000 enfermedades raras)';

-- =====================================================
-- Insertar códigos especiales del sistema
-- =====================================================

INSERT INTO orpha_nomenclatura (code, nombre, fuente, es_activo) VALUES
  ('PENDIENTE', 'Pendiente de Diagnóstico', 'Sistema', TRUE)
ON DUPLICATE KEY UPDATE
  nombre = VALUES(nombre),
  fecha_actualizacion = CURRENT_TIMESTAMP;

-- =====================================================
-- Verificar creación de tabla
-- =====================================================

SELECT
  'Tabla creada exitosamente' as 'Estado',
  COUNT(*) as 'Registros Iniciales'
FROM orpha_nomenclatura;

-- Mostrar estructura de la tabla
SHOW CREATE TABLE orpha_nomenclatura;

-- =====================================================
-- Fin de migración
-- =====================================================
