/**
 * Patient Controller
 * Maneja operaciones relacionadas con pacientes
 */

const Patient = require('../models/Patient');

/**
 * Buscar paciente por NHC
 * GET /api/patients/:nhc
 */
exports.getByNHC = async (req, res) => {
  try {
    const { nhc } = req.params;

    const patient = await Patient.findByNHC(nhc);

    if (!patient) {
      return res.status(404).json({
        error: 'Paciente no encontrado',
        nhc
      });
    }

    res.json(patient);
  } catch (error) {
    console.error('Error buscando paciente:', error);
    res.status(500).json({
      error: 'Error buscando paciente',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Listar pacientes con filtros opcionales
 * GET /api/patients?diagnostico=ORPHA123&limit=50&offset=0
 */
exports.getAll = async (req, res) => {
  try {
    const {
      diagnostico,
      limit = 100,
      offset = 0,
      sort = 'fecha_ultimo_seguimiento',
      order = 'desc'
    } = req.query;

    // Validar y parsear parámetros numéricos
    const parsedLimit = Math.min(parseInt(limit) || 100, 1000); // Máximo 1000
    const parsedOffset = parseInt(offset) || 0;

    let result;

    if (diagnostico) {
      // Buscar por diagnóstico específico
      const patients = await Patient.findByDiagnostico(
        diagnostico,
        parsedLimit,
        parsedOffset
      );

      result = {
        patients,
        pagination: {
          limit: parsedLimit,
          offset: parsedOffset,
          hasMore: patients.length === parsedLimit
        }
      };
    } else {
      // Listar todos los pacientes
      result = await Patient.findAll(
        parsedLimit,
        parsedOffset,
        sort,
        order
      );

      result = {
        patients: result.patients,
        pagination: {
          total: result.total,
          limit: parsedLimit,
          offset: parsedOffset,
          hasMore: parsedOffset + parsedLimit < result.total
        }
      };
    }

    res.json(result);
  } catch (error) {
    console.error('Error obteniendo pacientes:', error);
    res.status(500).json({
      error: 'Error obteniendo pacientes',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Obtener estadísticas
 * GET /api/patients/stats
 */
exports.getStatistics = async (req, res) => {
  try {
    const stats = await Patient.getStatistics();
    res.json(stats);
  } catch (error) {
    console.error('Error obteniendo estadísticas:', error);
    res.status(500).json({
      error: 'Error obteniendo estadísticas',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Crear nuevo paciente
 * POST /api/patients
 */
exports.create = async (req, res) => {
  try {
    const { nhc, diagnosticos, fecha_ultimo_seguimiento } = req.body;

    const newPatient = await Patient.create({
      nhc,
      diagnosticos,
      fecha_ultimo_seguimiento
    });

    res.status(201).json({
      message: 'Paciente creado correctamente',
      patient: newPatient
    });
  } catch (error) {
    console.error('Error creando paciente:', error);

    if (error.message === 'Ya existe un paciente con ese NHC') {
      return res.status(409).json({
        error: error.message,
        field: 'nhc',
        code: 'DUPLICATE_NHC'
      });
    }

    res.status(500).json({
      error: 'Error creando paciente',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Actualizar paciente
 * PUT /api/patients/:nhc
 */
exports.update = async (req, res) => {
  try {
    const { nhc } = req.params;
    const { diagnosticos, fecha_ultimo_seguimiento } = req.body;

    // Verificar que el paciente existe
    const patient = await Patient.findByNHC(nhc);
    if (!patient) {
      return res.status(404).json({
        error: 'Paciente no encontrado',
        nhc
      });
    }

    // Actualizar paciente
    const updated = await Patient.update(nhc, {
      diagnosticos,
      fecha_ultimo_seguimiento
    });

    if (!updated) {
      return res.status(500).json({
        error: 'Error actualizando paciente'
      });
    }

    res.json({
      message: 'Paciente actualizado correctamente'
    });
  } catch (error) {
    console.error('Error actualizando paciente:', error);
    res.status(500).json({
      error: 'Error actualizando paciente',
      code: 'SERVER_ERROR'
    });
  }
};
