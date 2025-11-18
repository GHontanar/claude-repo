/**
 * Patients Routes
 * Rutas de gestión de pacientes
 */

const express = require('express');
const router = express.Router();
const patientController = require('../controllers/patientController');
const { verifyToken } = require('../middleware/auth');
const { validateNHC, validatePatientData } = require('../middleware/validation');

// Todas las rutas requieren autenticación
router.use(verifyToken);

// GET /api/patients/stats - Obtener estadísticas (debe ir antes de /:nhc)
router.get('/stats', patientController.getStatistics);

// GET /api/patients - Listar pacientes con filtros
router.get('/', patientController.getAll);

// GET /api/patients/:nhc - Buscar paciente por NHC
router.get('/:nhc', validateNHC, patientController.getByNHC);

// POST /api/patients - Crear nuevo paciente
router.post('/', validatePatientData, patientController.create);

// PUT /api/patients/:nhc - Actualizar paciente
router.put('/:nhc', validateNHC, validatePatientData, patientController.update);

module.exports = router;
