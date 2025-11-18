-- =====================================================
-- Patient Tracking System - Database Schema
-- Version: 1.0.0
-- Description: Schema para sistema de seguimiento de pacientes
-- =====================================================

-- Crear base de datos (si no existe)
CREATE DATABASE IF NOT EXISTS hospital_patients
  CHARACTER SET utf8mb4
  COLLATE utf8mb4_unicode_ci;

USE hospital_patients;

-- =====================================================
-- Tabla: usuarios
-- Descripción: Almacena usuarios del sistema con roles
-- =====================================================

CREATE TABLE IF NOT EXISTS usuarios (
  id INT AUTO_INCREMENT PRIMARY KEY COMMENT 'ID único del usuario',
  username VARCHAR(50) NOT NULL UNIQUE COMMENT 'Nombre de usuario para login',
  password VARCHAR(255) NOT NULL COMMENT 'Hash bcrypt de la contraseña',
  rol ENUM('admin', 'usuario') NOT NULL DEFAULT 'usuario' COMMENT 'Rol: admin tiene acceso completo, usuario solo consultas',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación del usuario',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última actualización del registro',
  INDEX idx_username (username) COMMENT 'Índice para búsquedas rápidas por username'
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Usuarios del sistema';

-- =====================================================
-- Tabla: pacientes
-- Descripción: Almacena pacientes con diagnósticos ORPHA
-- =====================================================

CREATE TABLE IF NOT EXISTS pacientes (
  nhc VARCHAR(50) PRIMARY KEY COMMENT 'Número de Historia Clínica (único)',
  diagnosticos JSON NOT NULL COMMENT 'Array JSON de códigos ORPHA',
  fecha_ultimo_seguimiento DATE NOT NULL COMMENT 'Fecha de la última consulta médica',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP COMMENT 'Fecha de creación del registro',
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP COMMENT 'Última actualización del registro',
  CONSTRAINT chk_diagnosticos_not_empty CHECK (JSON_LENGTH(diagnosticos) > 0)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci COMMENT='Pacientes en seguimiento';

-- =====================================================
-- Índices para optimizar búsquedas
-- =====================================================

-- Índice en fecha para ordenamiento y filtrado
CREATE INDEX idx_fecha ON pacientes(fecha_ultimo_seguimiento);

-- Índice multi-valor para búsquedas por diagnóstico (MySQL 8.0.17+)
-- Si la versión de MySQL es anterior, comentar esta línea
CREATE INDEX idx_diagnosticos ON pacientes((CAST(diagnosticos AS CHAR(1000) ARRAY)));

-- =====================================================
-- Usuario administrador por defecto
-- Username: admin
-- Password: Hospital2024!
-- IMPORTANTE: Cambiar esta contraseña inmediatamente en producción
-- =====================================================

INSERT INTO usuarios (username, password, rol) VALUES
('admin', '$2b$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy', 'admin')
ON DUPLICATE KEY UPDATE username=username;

-- =====================================================
-- Fin del schema
-- =====================================================
