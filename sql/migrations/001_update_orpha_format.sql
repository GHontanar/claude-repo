-- =====================================================
-- Migración: Actualizar formato de códigos ORPHA
-- De: ORPHAXXXX
-- A:  ORPHA.XXXX
-- Fecha: 2024-11-19
-- =====================================================

USE hospital_patients;

-- Crear procedimiento temporal para migración
DELIMITER //

DROP PROCEDURE IF EXISTS migrate_orpha_format //

CREATE PROCEDURE migrate_orpha_format()
BEGIN
  DECLARE done INT DEFAULT FALSE;
  DECLARE v_nhc VARCHAR(50);
  DECLARE v_diagnosticos JSON;
  DECLARE v_diagnosticos_actualizados JSON;

  -- Cursor para iterar sobre todos los pacientes
  DECLARE cur CURSOR FOR SELECT nhc, diagnosticos FROM pacientes;
  DECLARE CONTINUE HANDLER FOR NOT FOUND SET done = TRUE;

  -- Variables de control
  DECLARE total_pacientes INT DEFAULT 0;
  DECLARE pacientes_actualizados INT DEFAULT 0;

  -- Contar total de pacientes
  SELECT COUNT(*) INTO total_pacientes FROM pacientes;

  SELECT CONCAT('Iniciando migración de ', total_pacientes, ' pacientes...') as 'Estado';

  -- Deshabilitar constraint temporalmente para evitar problemas
  SET @original_sql_mode = @@SESSION.sql_mode;
  SET SESSION sql_mode = REPLACE(@@SESSION.sql_mode, 'STRICT_TRANS_TABLES', '');

  OPEN cur;

  read_loop: LOOP
    FETCH cur INTO v_nhc, v_diagnosticos;

    IF done THEN
      LEAVE read_loop;
    END IF;

    -- Transformar cada elemento del array JSON
    -- Convertir ORPHAXXXX -> ORPHA.XXXX (solo si empieza con ORPHA y no tiene punto)
    SET v_diagnosticos_actualizados = (
      SELECT JSON_ARRAYAGG(
        CASE
          WHEN codigo REGEXP '^ORPHA[0-9]+$' THEN
            CONCAT('ORPHA.', SUBSTRING(codigo, 6))
          ELSE
            codigo
        END
      )
      FROM JSON_TABLE(
        v_diagnosticos,
        '$[*]' COLUMNS(codigo VARCHAR(50) PATH '$')
      ) AS jt
    );

    -- Actualizar el paciente si hubo cambios
    IF v_diagnosticos_actualizados != v_diagnosticos THEN
      UPDATE pacientes
      SET diagnosticos = v_diagnosticos_actualizados
      WHERE nhc = v_nhc;

      SET pacientes_actualizados = pacientes_actualizados + 1;
    END IF;

  END LOOP;

  CLOSE cur;

  -- Restaurar sql_mode original
  SET SESSION sql_mode = @original_sql_mode;

  -- Mostrar resumen
  SELECT
    total_pacientes as 'Total Pacientes',
    pacientes_actualizados as 'Pacientes Actualizados',
    (total_pacientes - pacientes_actualizados) as 'Sin Cambios';

END //

DELIMITER ;

-- Ejecutar migración
CALL migrate_orpha_format();

-- Validar migración
SELECT
  'Validación de migración' as 'Etapa',
  COUNT(*) as 'Total',
  SUM(CASE
    WHEN JSON_CONTAINS(diagnosticos, JSON_QUOTE('ORPHA%')) THEN 1
    ELSE 0
  END) as 'Posibles_Formato_Antiguo'
FROM pacientes;

-- Mostrar algunos ejemplos después de migración
SELECT
  nhc,
  diagnosticos,
  'Formato actualizado' as estado
FROM pacientes
LIMIT 5;

-- Limpiar procedimiento temporal
DROP PROCEDURE IF EXISTS migrate_orpha_format;

-- =====================================================
-- Fin de migración
-- =====================================================
