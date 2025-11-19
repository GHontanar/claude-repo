/**
 * Nomenclature Controller
 * Maneja las peticiones relacionadas con nomenclatura ORPHA
 */

const OrphaNomenclature = require('../models/OrphaNomenclature');
const { NOMENCLATURE } = require('../config/constants');

/**
 * Buscar nomenclaturas (autocomplete)
 * Solo retorna códigos que existen en pacientes registrados
 *
 * GET /api/nomenclature/search?q=fibro
 */
async function search(req, res) {
  try {
    const { q } = req.query;

    // Validar query
    if (!q || q.trim().length < 2) {
      return res.status(400).json({
        error: 'El parámetro "q" debe tener al menos 2 caracteres'
      });
    }

    // Buscar nomenclaturas que existen en pacientes
    const results = await OrphaNomenclature.searchInPatients(
      q.trim(),
      NOMENCLATURE.AUTOCOMPLETE_LIMIT
    );

    res.json(results);
  } catch (error) {
    console.error('Error en búsqueda de nomenclatura:', error);
    res.status(500).json({
      error: 'Error al buscar nomenclatura',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Obtener códigos ORPHA que están siendo usados
 * Con estadísticas de uso (número de pacientes)
 *
 * GET /api/nomenclature/in-use
 */
async function getCodesInUse(req, res) {
  try {
    const codes = await OrphaNomenclature.getCodesInUse();

    res.json({
      total: codes.length,
      codes
    });
  } catch (error) {
    console.error('Error obteniendo códigos en uso:', error);
    res.status(500).json({
      error: 'Error al obtener códigos en uso',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Obtener estadísticas de nomenclatura
 *
 * GET /api/nomenclature/stats
 */
async function getStats(req, res) {
  try {
    const stats = await OrphaNomenclature.getStats();

    res.json(stats);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      error: 'Error al obtener estadísticas',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Obtener nomenclatura por código específico
 *
 * GET /api/nomenclature/:code
 */
async function getByCode(req, res) {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({ error: 'Código requerido' });
    }

    const nomenclature = await OrphaNomenclature.findByCode(code);

    if (!nomenclature) {
      return res.status(404).json({
        error: 'Nomenclatura no encontrada',
        code
      });
    }

    res.json(nomenclature);
  } catch (error) {
    console.error('Error obteniendo nomenclatura:', error);
    res.status(500).json({
      error: 'Error al obtener nomenclatura',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Listar todas las nomenclaturas (con paginación y filtros)
 *
 * GET /api/nomenclature?limit=100&offset=0&fuente=Orphanet&esActivo=true
 */
async function getAll(req, res) {
  try {
    const filters = {
      limit: req.query.limit,
      offset: req.query.offset,
      fuente: req.query.fuente,
      esActivo: req.query.esActivo !== undefined ? req.query.esActivo === 'true' : undefined
    };

    const result = await OrphaNomenclature.findAll(filters);

    res.json(result);
  } catch (error) {
    console.error('Error listando nomenclaturas:', error);
    res.status(500).json({
      error: 'Error al listar nomenclaturas',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Crear o actualizar nomenclatura (solo admin)
 *
 * POST /api/nomenclature
 * Body: { code, nombre, nombre_cientifico?, grupo_clinico?, es_activo? }
 */
async function create(req, res) {
  try {
    const { code, nombre, nombre_cientifico, grupo_clinico, es_activo } = req.body;

    // Validar campos requeridos
    if (!code || !nombre) {
      return res.status(400).json({
        error: 'Los campos "code" y "nombre" son requeridos'
      });
    }

    // Validar formato de código
    if (!code.startsWith('ORPHA.') && code !== 'PENDIENTE') {
      return res.status(400).json({
        error: 'Formato de código inválido. Debe ser ORPHA.XXXX o PENDIENTE'
      });
    }

    const nomenclature = await OrphaNomenclature.upsert({
      code,
      nombre,
      nombre_cientifico,
      grupo_clinico,
      es_activo,
      fuente: 'Manual'
    });

    res.status(201).json(nomenclature);
  } catch (error) {
    console.error('Error creando nomenclatura:', error);
    res.status(500).json({
      error: 'Error al crear nomenclatura',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

/**
 * Eliminar nomenclatura (soft delete - solo admin)
 *
 * DELETE /api/nomenclature/:code
 */
async function remove(req, res) {
  try {
    const { code } = req.params;

    if (!code) {
      return res.status(400).json({ error: 'Código requerido' });
    }

    // No permitir eliminar el placeholder PENDIENTE
    if (code === 'PENDIENTE') {
      return res.status(403).json({
        error: 'No se puede eliminar el código PENDIENTE (es un código del sistema)'
      });
    }

    const deleted = await OrphaNomenclature.softDelete(code);

    if (!deleted) {
      return res.status(404).json({ error: 'Nomenclatura no encontrada' });
    }

    res.json({
      message: 'Nomenclatura marcada como inactiva',
      code
    });
  } catch (error) {
    console.error('Error eliminando nomenclatura:', error);
    res.status(500).json({
      error: 'Error al eliminar nomenclatura',
      details: process.env.NODE_ENV === 'development' ? error.message : undefined
    });
  }
}

module.exports = {
  search,
  getCodesInUse,
  getStats,
  getByCode,
  getAll,
  create,
  remove
};
