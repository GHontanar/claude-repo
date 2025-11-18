/**
 * Export Routes
 * Rutas de exportación de datos a XLSX
 */

const express = require('express');
const router = express.Router();
const exportController = require('../controllers/exportController');
const { verifyToken } = require('../middleware/auth');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/export/patients - Exportar pacientes a XLSX
router.get('/patients', exportController.exportPatients);

// GET /api/export/stats - Exportar estadísticas a XLSX
router.get('/stats', exportController.exportStats);

module.exports = router;
