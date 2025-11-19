/**
 * Patient Model
 * Maneja todas las operaciones de base de datos relacionadas con pacientes
 */

const pool = require('../config/database');

class Patient {
  /**
   * Buscar paciente por NHC
   * @param {string} nhc - Número de Historia Clínica
   * @returns {Object|null} Paciente encontrado o null
   */
  static async findByNHC(nhc) {
    try {
      const [rows] = await pool.execute(
        'SELECT nhc, diagnosticos, fecha_ultimo_seguimiento, created_at, updated_at FROM pacientes WHERE nhc = ?',
        [nhc]
      );

      if (rows[0]) {
        // MySQL driver ya parsea automáticamente las columnas JSON
        return rows[0];
      }
      return null;
    } catch (error) {
      throw new Error(`Error buscando paciente: ${error.message}`);
    }
  }

  /**
   * Buscar pacientes por diagnóstico
   * @param {string} codigoOrpha - Código ORPHA del diagnóstico
   * @param {number} limit - Límite de resultados
   * @param {number} offset - Offset para paginación
   * @returns {Array} Lista de pacientes
   */
  static async findByDiagnostico(codigoOrpha, limit = 100, offset = 0) {
    try {
      // Parsear parámetros numéricos
      const parsedLimit = parseInt(limit) || 100;
      const parsedOffset = parseInt(offset) || 0;

      const [rows] = await pool.execute(
        `SELECT nhc, diagnosticos, fecha_ultimo_seguimiento
         FROM pacientes
         WHERE JSON_CONTAINS(diagnosticos, JSON_QUOTE(?))
         ORDER BY fecha_ultimo_seguimiento DESC
         LIMIT ? OFFSET ?`,
        [codigoOrpha, parsedLimit, parsedOffset]
      );

      // MySQL driver ya parsea automáticamente las columnas JSON
      return rows;
    } catch (error) {
      throw new Error(`Error buscando por diagnóstico: ${error.message}`);
    }
  }

  /**
   * Obtener todos los pacientes con paginación
   * @param {number} limit - Límite de resultados
   * @param {number} offset - Offset para paginación
   * @param {string} sort - Campo de ordenamiento
   * @param {string} order - Orden (asc/desc)
   * @returns {Object} { patients, total }
   */
  static async findAll(limit = 100, offset = 0, sort = 'fecha_ultimo_seguimiento', order = 'desc') {
    try {
      // Parsear y validar parámetros numéricos
      const parsedLimit = parseInt(limit) || 100;
      const parsedOffset = parseInt(offset) || 0;

      // Validar parámetros de ordenamiento
      const validSortFields = ['nhc', 'fecha_ultimo_seguimiento', 'created_at'];
      const validOrders = ['asc', 'desc'];

      const sortField = validSortFields.includes(sort) ? sort : 'fecha_ultimo_seguimiento';
      const sortOrder = validOrders.includes(order.toLowerCase()) ? order.toUpperCase() : 'DESC';

      // Obtener pacientes
      const [rows] = await pool.execute(
        `SELECT nhc, diagnosticos, fecha_ultimo_seguimiento
         FROM pacientes
         ORDER BY ${sortField} ${sortOrder}
         LIMIT ? OFFSET ?`,
        [parsedLimit, parsedOffset]
      );

      // Obtener total de pacientes
      const [countRows] = await pool.execute('SELECT COUNT(*) as total FROM pacientes');

      // MySQL driver ya parsea automáticamente las columnas JSON
      return {
        patients: rows,
        total: countRows[0].total
      };
    } catch (error) {
      throw new Error(`Error obteniendo pacientes: ${error.message}`);
    }
  }

  /**
   * Crear nuevo paciente
   * @param {Object} patientData - Datos del paciente
   * @param {string} patientData.nhc - Número de Historia Clínica
   * @param {Array} patientData.diagnosticos - Array de códigos ORPHA
   * @param {string} patientData.fecha_ultimo_seguimiento - Fecha YYYY-MM-DD
   * @returns {Object} Paciente creado
   */
  static async create({ nhc, diagnosticos, fecha_ultimo_seguimiento }) {
    try {
      const diagnosticosJSON = JSON.stringify(diagnosticos);

      await pool.execute(
        'INSERT INTO pacientes (nhc, diagnosticos, fecha_ultimo_seguimiento) VALUES (?, ?, ?)',
        [nhc, diagnosticosJSON, fecha_ultimo_seguimiento]
      );

      return { nhc, diagnosticos, fecha_ultimo_seguimiento };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('Ya existe un paciente con ese NHC');
      }
      throw new Error(`Error creando paciente: ${error.message}`);
    }
  }

  /**
   * Actualizar paciente existente
   * @param {string} nhc - Número de Historia Clínica
   * @param {Object} updateData - Datos a actualizar
   * @param {Array} updateData.diagnosticos - Array de códigos ORPHA
   * @param {string} updateData.fecha_ultimo_seguimiento - Fecha YYYY-MM-DD
   * @returns {boolean} true si se actualizó correctamente
   */
  static async update(nhc, { diagnosticos, fecha_ultimo_seguimiento }) {
    try {
      const diagnosticosJSON = JSON.stringify(diagnosticos);

      const [result] = await pool.execute(
        'UPDATE pacientes SET diagnosticos = ?, fecha_ultimo_seguimiento = ? WHERE nhc = ?',
        [diagnosticosJSON, fecha_ultimo_seguimiento, nhc]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error actualizando paciente: ${error.message}`);
    }
  }

  /**
   * Obtener estadísticas generales
   * @returns {Object} Estadísticas del sistema
   */
  static async getStatistics() {
    try {
      // Total de pacientes
      const [totalRows] = await pool.execute('SELECT COUNT(*) as total FROM pacientes');
      const totalPacientes = totalRows[0].total;

      // Pacientes sin seguimiento reciente (>1 año)
      const [sinSeguimientoRows] = await pool.execute(
        `SELECT COUNT(*) as count FROM pacientes
         WHERE fecha_ultimo_seguimiento < DATE_SUB(CURDATE(), INTERVAL 1 YEAR)`
      );
      const pacientesSinSeguimiento = sinSeguimientoRows[0].count;

      // Diagnósticos más frecuentes (Top 10)
      const [diagnosticosFrecuentesRows] = await pool.execute(
        `SELECT diag as codigo, COUNT(*) as count
         FROM pacientes,
         JSON_TABLE(diagnosticos, '$[*]' COLUMNS(diag VARCHAR(20) PATH '$')) AS jt
         GROUP BY diag
         ORDER BY count DESC
         LIMIT 10`
      );

      // Total diagnósticos únicos
      const [diagnosticosUnicosRows] = await pool.execute(
        `SELECT COUNT(DISTINCT diag) as count
         FROM pacientes,
         JSON_TABLE(diagnosticos, '$[*]' COLUMNS(diag VARCHAR(20) PATH '$')) AS jt`
      );
      const totalDiagnosticosUnicos = diagnosticosUnicosRows[0].count;

      return {
        total_pacientes: totalPacientes,
        total_diagnosticos_unicos: totalDiagnosticosUnicos,
        pacientes_sin_seguimiento_reciente: pacientesSinSeguimiento,
        diagnosticos_frecuentes: diagnosticosFrecuentesRows
      };
    } catch (error) {
      throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    }
  }

  /**
   * Buscar pacientes por rango de fechas
   * @param {string} fechaDesde - Fecha desde (YYYY-MM-DD)
   * @param {string} fechaHasta - Fecha hasta (YYYY-MM-DD)
   * @returns {Array} Lista de pacientes
   */
  static async findByDateRange(fechaDesde, fechaHasta) {
    try {
      const [rows] = await pool.execute(
        `SELECT nhc, diagnosticos, fecha_ultimo_seguimiento
         FROM pacientes
         WHERE fecha_ultimo_seguimiento BETWEEN ? AND ?
         ORDER BY fecha_ultimo_seguimiento DESC`,
        [fechaDesde, fechaHasta]
      );

      // MySQL driver ya parsea automáticamente las columnas JSON
      return rows;
    } catch (error) {
      throw new Error(`Error buscando por rango de fechas: ${error.message}`);
    }
  }
}

module.exports = Patient;
