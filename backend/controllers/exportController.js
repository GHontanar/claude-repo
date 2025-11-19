/**
 * Export Controller
 * Maneja la exportación de datos a XLSX
 */

const Patient = require('../models/Patient');
const { generatePatientsXLSX, generateStatsXLSX } = require('../utils/xlsxGenerator');
const { enrichPatientsWithNomenclature } = require('../utils/orphaNomenclature');

/**
 * Exportar pacientes a XLSX
 * GET /api/export/patients?diagnostico=ORPHA123&fecha_desde=2024-01-01&fecha_hasta=2024-12-31
 */
exports.exportPatients = async (req, res) => {
  try {
    const { diagnostico, nhc, fecha_desde, fecha_hasta } = req.query;

    let patients;

    if (nhc) {
      // Exportar un paciente específico
      const patient = await Patient.findByNHC(nhc);
      patients = patient ? [patient] : [];
    } else if (diagnostico) {
      // Exportar por diagnóstico
      patients = await Patient.findByDiagnostico(diagnostico, 10000, 0); // Límite alto para exportación
    } else if (fecha_desde && fecha_hasta) {
      // Exportar por rango de fechas
      patients = await Patient.findByDateRange(fecha_desde, fecha_hasta);
    } else {
      // Exportar todos
      const result = await Patient.findAll(10000, 0); // Límite alto
      patients = result.patients;
    }

    if (patients.length === 0) {
      return res.status(404).json({
        error: 'No se encontraron pacientes con los criterios especificados'
      });
    }

    // Enriquecer pacientes con nomenclatura
    const enrichedPatients = await enrichPatientsWithNomenclature(patients);

    // Generar archivo XLSX
    const buffer = generatePatientsXLSX(enrichedPatients);

    // Generar nombre de archivo con fecha actual
    const fecha = new Date().toISOString().split('T')[0];
    const filename = `pacientes_${fecha}.xlsx`;

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    // Enviar archivo
    res.send(buffer);
  } catch (error) {
    console.error('Error exportando pacientes:', error);
    res.status(500).json({
      error: 'Error exportando datos',
      code: 'EXPORT_ERROR'
    });
  }
};

/**
 * Exportar estadísticas a XLSX
 * GET /api/export/stats
 */
exports.exportStats = async (req, res) => {
  try {
    // Obtener estadísticas
    const stats = await Patient.getStatistics();

    // Generar archivo XLSX
    const buffer = generateStatsXLSX(stats);

    // Generar nombre de archivo
    const fecha = new Date().toISOString().split('T')[0];
    const filename = `estadisticas_${fecha}.xlsx`;

    // Configurar headers para descarga
    res.setHeader('Content-Type', 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet');
    res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
    res.setHeader('Content-Length', buffer.length);

    // Enviar archivo
    res.send(buffer);
  } catch (error) {
    console.error('Error exportando estadísticas:', error);
    res.status(500).json({
      error: 'Error exportando estadísticas',
      code: 'EXPORT_ERROR'
    });
  }
};
