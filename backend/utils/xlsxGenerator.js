/**
 * XLSX Generator
 * Genera archivos XLSX para exportación de datos
 */

const XLSX = require('xlsx');

/**
 * Generar archivo XLSX desde datos de pacientes
 * @param {Array} patients - Array de objetos de pacientes
 * @returns {Buffer} Buffer del archivo XLSX
 */
function generatePatientsXLSX(patients) {
  try {
    // Transformar datos para el formato de Excel
    const data = patients.map(patient => ({
      'NHC': patient.nhc,
      'Diagnósticos': Array.isArray(patient.diagnosticos)
        ? patient.diagnosticos.join(', ')
        : patient.diagnosticos,
      'Fecha Último Seguimiento': patient.fecha_ultimo_seguimiento
    }));

    // Crear worksheet desde datos
    const worksheet = XLSX.utils.json_to_sheet(data);

    // Configurar anchos de columnas
    worksheet['!cols'] = [
      { wch: 15 },  // NHC
      { wch: 40 },  // Diagnósticos
      { wch: 25 }   // Fecha
    ];

    // Crear workbook
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Pacientes');

    // Generar buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return buffer;
  } catch (error) {
    throw new Error(`Error generando archivo XLSX: ${error.message}`);
  }
}

/**
 * Generar archivo XLSX de estadísticas
 * @param {Object} stats - Objeto de estadísticas
 * @returns {Buffer} Buffer del archivo XLSX
 */
function generateStatsXLSX(stats) {
  try {
    const workbook = XLSX.utils.book_new();

    // Hoja 1: Resumen general
    const summaryData = [
      { 'Métrica': 'Total de Pacientes', 'Valor': stats.total_pacientes },
      { 'Métrica': 'Total de Diagnósticos Únicos', 'Valor': stats.total_diagnosticos_unicos },
      { 'Métrica': 'Pacientes sin Seguimiento Reciente', 'Valor': stats.pacientes_sin_seguimiento_reciente }
    ];
    const summaryWorksheet = XLSX.utils.json_to_sheet(summaryData);
    summaryWorksheet['!cols'] = [{ wch: 40 }, { wch: 15 }];
    XLSX.utils.book_append_sheet(workbook, summaryWorksheet, 'Resumen');

    // Hoja 2: Diagnósticos frecuentes
    if (stats.diagnosticos_frecuentes && stats.diagnosticos_frecuentes.length > 0) {
      const diagData = stats.diagnosticos_frecuentes.map(diag => ({
        'Código ORPHA': diag.codigo,
        'Cantidad de Pacientes': diag.count
      }));
      const diagWorksheet = XLSX.utils.json_to_sheet(diagData);
      diagWorksheet['!cols'] = [{ wch: 20 }, { wch: 25 }];
      XLSX.utils.book_append_sheet(workbook, diagWorksheet, 'Diagnósticos Frecuentes');
    }

    // Generar buffer
    const buffer = XLSX.write(workbook, { type: 'buffer', bookType: 'xlsx' });

    return buffer;
  } catch (error) {
    throw new Error(`Error generando archivo de estadísticas: ${error.message}`);
  }
}

module.exports = {
  generatePatientsXLSX,
  generateStatsXLSX
};
