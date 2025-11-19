/**
 * OrphaNomenclature Model
 * Maneja todas las operaciones de base de datos relacionadas con nomenclatura ORPHA
 */

const pool = require('../config/database');

class OrphaNomenclature {
  /**
   * Obtener nomenclatura por código
   * @param {string} code - Código ORPHA (ej: ORPHA.123)
   * @returns {Object|null} Nomenclatura encontrada o null
   */
  static async findByCode(code) {
    try {
      const [rows] = await pool.execute(
        'SELECT * FROM orpha_nomenclatura WHERE code = ?',
        [code]
      );

      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error buscando nomenclatura: ${error.message}`);
    }
  }

  /**
   * Obtener nomenclaturas de múltiples códigos
   * Retorna un mapa { code: nombre } para lookup rápido
   * @param {Array<string>} codes - Array de códigos ORPHA
   * @returns {Object} Mapa de códigos a nombres
   */
  static async findByCodes(codes) {
    if (!codes || codes.length === 0) return {};

    try {
      // Filtrar códigos vacíos o null
      const validCodes = codes.filter(c => c && c.trim() !== '');

      if (validCodes.length === 0) return {};

      const [rows] = await pool.execute(
        'SELECT code, nombre FROM orpha_nomenclatura WHERE code IN (?)',
        [validCodes]
      );

      // Convertir a map para fácil lookup
      return rows.reduce((acc, row) => {
        acc[row.code] = row.nombre;
        return acc;
      }, {});
    } catch (error) {
      throw new Error(`Error buscando nomenclaturas: ${error.message}`);
    }
  }

  /**
   * Buscar nomenclaturas (para autocomplete)
   * Solo retorna códigos que existen en pacientes
   * @param {string} query - Término de búsqueda (código o nombre)
   * @param {number} limit - Límite de resultados
   * @returns {Array} Lista de nomenclaturas que coinciden y existen en pacientes
   */
  static async searchInPatients(query, limit = 20) {
    try {
      const searchTerm = `%${query}%`;
      const parsedLimit = parseInt(limit) || 20;

      const [rows] = await pool.execute(`
        SELECT DISTINCT
          n.code,
          n.nombre
        FROM orpha_nomenclatura n
        INNER JOIN (
          -- Extraer códigos únicos de pacientes
          SELECT DISTINCT JSON_UNQUOTE(diag.value) as codigo
          FROM pacientes p,
          JSON_TABLE(
            p.diagnosticos,
            '$[*]' COLUMNS(value VARCHAR(50) PATH '$')
          ) as diag
        ) AS codigos_usados ON n.code = codigos_usados.codigo
        WHERE n.code LIKE ? OR n.nombre LIKE ?
        ORDER BY
          -- Priorizar coincidencias exactas de código
          CASE WHEN n.code = ? THEN 0 ELSE 1 END,
          -- Luego coincidencias que empiezan con el término
          CASE WHEN n.code LIKE ? THEN 0 ELSE 1 END,
          CASE WHEN n.nombre LIKE ? THEN 0 ELSE 1 END,
          -- Finalmente alfabético
          n.code
        LIMIT ${parsedLimit}
      `, [searchTerm, searchTerm, query, `${query}%`, `${query}%`]);

      return rows;
    } catch (error) {
      throw new Error(`Error en búsqueda de nomenclatura: ${error.message}`);
    }
  }

  /**
   * Obtener todos los códigos ORPHA únicos que existen en pacientes
   * Con su nomenclatura
   * @returns {Array} Lista de códigos usados con nomenclatura
   */
  static async getCodesInUse() {
    try {
      const [rows] = await pool.execute(`
        SELECT DISTINCT
          n.code,
          n.nombre,
          COUNT(p.nhc) as patient_count
        FROM orpha_nomenclatura n
        INNER JOIN (
          SELECT nhc, JSON_UNQUOTE(diag.value) as codigo
          FROM pacientes,
          JSON_TABLE(
            diagnosticos,
            '$[*]' COLUMNS(value VARCHAR(50) PATH '$')
          ) as diag
        ) AS pacientes_diag ON n.code = pacientes_diag.codigo
        GROUP BY n.code, n.nombre
        ORDER BY patient_count DESC, n.code
      `);

      return rows;
    } catch (error) {
      throw new Error(`Error obteniendo códigos en uso: ${error.message}`);
    }
  }

  /**
   * Obtener todas las nomenclaturas (con filtros opcionales)
   * @param {Object} filters - Filtros opcionales
   * @param {boolean} filters.esActivo - Filtrar por estado activo
   * @param {string} filters.fuente - Filtrar por fuente (Orphanet, Sistema)
   * @param {number} filters.limit - Límite de resultados
   * @param {number} filters.offset - Offset para paginación
   * @returns {Object} { nomenclaturas, total }
   */
  static async findAll(filters = {}) {
    try {
      let query = 'SELECT * FROM orpha_nomenclatura WHERE 1=1';
      const params = [];

      if (filters.esActivo !== undefined) {
        query += ' AND es_activo = ?';
        params.push(filters.esActivo);
      }

      if (filters.fuente) {
        query += ' AND fuente = ?';
        params.push(filters.fuente);
      }

      // Contar total antes de aplicar limit/offset
      const countQuery = query.replace('SELECT *', 'SELECT COUNT(*) as total');
      const [countRows] = await pool.execute(countQuery, params);
      const total = countRows[0].total;

      // Aplicar ordenamiento
      query += ' ORDER BY code';

      // Aplicar limit y offset
      if (filters.limit) {
        const parsedLimit = parseInt(filters.limit) || 100;
        const parsedOffset = parseInt(filters.offset) || 0;
        query += ` LIMIT ${parsedLimit} OFFSET ${parsedOffset}`;
      }

      const [rows] = await pool.execute(query, params);

      return {
        nomenclaturas: rows,
        total
      };
    } catch (error) {
      throw new Error(`Error obteniendo nomenclaturas: ${error.message}`);
    }
  }

  /**
   * Estadísticas de nomenclatura
   * @returns {Object} Estadísticas del sistema
   */
  static async getStats() {
    try {
      const [rows] = await pool.execute(`
        SELECT
          COUNT(*) as total_nomenclaturas,
          COUNT(CASE WHEN fuente = 'Orphanet' THEN 1 END) as orphanet_count,
          COUNT(CASE WHEN fuente = 'Sistema' THEN 1 END) as sistema_count,
          COUNT(CASE WHEN es_activo = TRUE THEN 1 END) as activos_count,
          COUNT(CASE WHEN es_activo = FALSE THEN 1 END) as inactivos_count,
          MAX(fecha_actualizacion) as ultima_actualizacion,
          MAX(version_orphanet) as version_actual
        FROM orpha_nomenclatura
      `);

      // Obtener códigos más usados
      const [topCodes] = await pool.execute(`
        SELECT
          n.code,
          n.nombre,
          COUNT(DISTINCT p.nhc) as patient_count
        FROM orpha_nomenclatura n
        INNER JOIN (
          SELECT nhc, JSON_UNQUOTE(diag.value) as codigo
          FROM pacientes,
          JSON_TABLE(
            diagnosticos,
            '$[*]' COLUMNS(value VARCHAR(50) PATH '$')
          ) as diag
        ) AS pacientes_diag ON n.code = pacientes_diag.codigo
        GROUP BY n.code, n.nombre
        ORDER BY patient_count DESC
        LIMIT 10
      `);

      return {
        ...rows[0],
        top_codes: topCodes
      };
    } catch (error) {
      throw new Error(`Error obteniendo estadísticas: ${error.message}`);
    }
  }

  /**
   * Crear o actualizar nomenclatura
   * @param {Object} data - Datos de la nomenclatura
   * @returns {Object} Nomenclatura creada/actualizada
   */
  static async upsert(data) {
    try {
      const {
        code,
        nombre,
        nombre_cientifico = null,
        grupo_clinico = null,
        es_activo = true,
        fuente = 'Sistema',
        version_orphanet = null
      } = data;

      await pool.execute(
        `INSERT INTO orpha_nomenclatura
         (code, nombre, nombre_cientifico, grupo_clinico, es_activo, fuente, version_orphanet)
         VALUES (?, ?, ?, ?, ?, ?, ?)
         ON DUPLICATE KEY UPDATE
           nombre = VALUES(nombre),
           nombre_cientifico = VALUES(nombre_cientifico),
           grupo_clinico = VALUES(grupo_clinico),
           es_activo = VALUES(es_activo),
           version_orphanet = VALUES(version_orphanet),
           fecha_actualizacion = CURRENT_TIMESTAMP`,
        [code, nombre, nombre_cientifico, grupo_clinico, es_activo, fuente, version_orphanet]
      );

      return await this.findByCode(code);
    } catch (error) {
      throw new Error(`Error creando/actualizando nomenclatura: ${error.message}`);
    }
  }

  /**
   * Eliminar nomenclatura (soft delete - marcar como inactivo)
   * @param {string} code - Código ORPHA
   * @returns {boolean} true si se actualizó correctamente
   */
  static async softDelete(code) {
    try {
      const [result] = await pool.execute(
        'UPDATE orpha_nomenclatura SET es_activo = FALSE WHERE code = ?',
        [code]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error eliminando nomenclatura: ${error.message}`);
    }
  }

  /**
   * Eliminar nomenclatura permanentemente
   * @param {string} code - Código ORPHA
   * @returns {boolean} true si se eliminó correctamente
   */
  static async delete(code) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM orpha_nomenclatura WHERE code = ?',
        [code]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error eliminando nomenclatura: ${error.message}`);
    }
  }
}

module.exports = OrphaNomenclature;
