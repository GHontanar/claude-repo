/**
 * Nomenclature Routes
 * Rutas para operaciones de nomenclatura ORPHA
 */

const express = require('express');
const router = express.Router();
const nomenclatureController = require('../controllers/nomenclatureController');
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// =====================================================
// RUTAS PÚBLICAS (requieren autenticación, cualquier rol)
// =====================================================

/**
 * @route   GET /api/nomenclature/search
 * @desc    Buscar nomenclaturas (autocomplete)
 * @access  Private (usuario o admin)
 * @query   q - Término de búsqueda (mínimo 2 caracteres)
 * @returns Array de { code, nombre }
 */
router.get('/search', nomenclatureController.search);

/**
 * @route   GET /api/nomenclature/in-use
 * @desc    Obtener códigos ORPHA que están siendo usados
 * @access  Private (usuario o admin)
 * @returns { total, codes: [{code, nombre, patient_count}] }
 */
router.get('/in-use', nomenclatureController.getCodesInUse);

/**
 * @route   GET /api/nomenclature/stats
 * @desc    Estadísticas de nomenclatura
 * @access  Private (usuario o admin)
 * @returns Objeto con estadísticas
 */
router.get('/stats', nomenclatureController.getStats);

/**
 * @route   GET /api/nomenclature/:code
 * @desc    Obtener nomenclatura por código
 * @access  Private (usuario o admin)
 * @param   code - Código ORPHA (ej: ORPHA.123)
 * @returns Objeto de nomenclatura completo
 */
router.get('/:code', nomenclatureController.getByCode);

/**
 * @route   GET /api/nomenclature
 * @desc    Listar todas las nomenclaturas
 * @access  Private (usuario o admin)
 * @query   limit, offset, fuente, esActivo
 * @returns { nomenclaturas: [], total }
 */
router.get('/', nomenclatureController.getAll);

// =====================================================
// RUTAS ADMINISTRATIVAS (solo admin)
// =====================================================

/**
 * @route   POST /api/nomenclature
 * @desc    Crear o actualizar nomenclatura manualmente
 * @access  Private (solo admin)
 * @body    { code, nombre, nombre_cientifico?, grupo_clinico?, es_activo? }
 * @returns Objeto de nomenclatura creado/actualizado
 */
router.post('/', requireAdmin, nomenclatureController.create);

/**
 * @route   DELETE /api/nomenclature/:code
 * @desc    Eliminar nomenclatura (soft delete)
 * @access  Private (solo admin)
 * @param   code - Código ORPHA a eliminar
 * @returns Mensaje de confirmación
 */
router.delete('/:code', requireAdmin, nomenclatureController.remove);

module.exports = router;
