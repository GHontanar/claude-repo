-- =====================================================
-- Migración: Actualizar formato de códigos ORPHA
-- De: ORPHAXXXX
-- A:  ORPHA.XXXX
-- Fecha: 2024-11-19
-- =====================================================

USE hospital_patients;

-- Mostrar estado inicial
SELECT
  'Estado inicial' as 'Etapa',
  COUNT(*) as 'Total Pacientes'
FROM pacientes;

-- Crear tabla temporal para almacenar los datos actualizados
CREATE TEMPORARY TABLE IF NOT EXISTS temp_diagnosticos_actualizados (
  nhc VARCHAR(50) PRIMARY KEY,
  diagnosticos_nuevos JSON
);

-- Insertar datos actualizados en tabla temporal
-- Convertir ORPHAXXXX -> ORPHA.XXXX (solo códigos sin punto)
INSERT INTO temp_diagnosticos_actualizados (nhc, diagnosticos_nuevos)
SELECT
  p.nhc,
  (
    SELECT JSON_ARRAYAGG(
      CASE
        WHEN codigo REGEXP '^ORPHA[0-9]+$' THEN
          CONCAT('ORPHA.', SUBSTRING(codigo, 6))
        ELSE
          codigo
      END
    )
    FROM JSON_TABLE(
      p.diagnosticos,
      '$[*]' COLUMNS(codigo VARCHAR(50) PATH '$')
    ) AS jt
  ) as diagnosticos_nuevos
FROM pacientes p;

-- Mostrar cuántos pacientes serán actualizados
SELECT
  'Pacientes a actualizar' as 'Etapa',
  COUNT(*) as 'Cantidad'
FROM temp_diagnosticos_actualizados t
JOIN pacientes p ON t.nhc = p.nhc
WHERE t.diagnosticos_nuevos != p.diagnosticos;

-- Realizar la actualización
UPDATE pacientes p
INNER JOIN temp_diagnosticos_actualizados t ON p.nhc = t.nhc
SET p.diagnosticos = t.diagnosticos_nuevos
WHERE t.diagnosticos_nuevos != p.diagnosticos;

-- Mostrar resultados
SELECT
  'Migración completada' as 'Etapa',
  ROW_COUNT() as 'Pacientes actualizados';

-- Validar que no quedan códigos en formato antiguo
SELECT
  'Validación final' as 'Etapa',
  COUNT(*) as 'Total Pacientes',
  SUM(
    CASE
      WHEN JSON_SEARCH(diagnosticos, 'one', 'ORPHA%', NULL, '$[*]') IS NOT NULL
         AND JSON_SEARCH(diagnosticos, 'one', 'ORPHA.%', NULL, '$[*]') IS NULL
      THEN 1
      ELSE 0
    END
  ) as 'Formato_Antiguo_Restante'
FROM pacientes;

-- Mostrar algunos ejemplos después de migración
SELECT
  'Ejemplos actualizados' as 'Etapa',
  nhc,
  diagnosticos
FROM pacientes
LIMIT 5;

-- Limpiar tabla temporal
DROP TEMPORARY TABLE IF EXISTS temp_diagnosticos_actualizados;

-- =====================================================
-- Fin de migración
-- =====================================================
