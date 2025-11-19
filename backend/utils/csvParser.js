/**
 * CSV/XLSX Parser
 * Procesa archivos CSV y XLSX para importación de pacientes
 */

const csv = require('csv-parser');
const fs = require('fs');
const XLSX = require('xlsx');

/**
 * Parsear archivo CSV
 * @param {string} filePath - Ruta del archivo CSV
 * @returns {Promise<Array>} Array de objetos con datos de pacientes
 */
async function parseCSV(filePath) {
  return new Promise((resolve, reject) => {
    const results = [];

    fs.createReadStream(filePath)
      .pipe(csv())
      .on('data', (data) => results.push(data))
      .on('end', () => resolve(results))
      .on('error', (error) => reject(error));
  });
}

/**
 * Parsear archivo XLSX
 * @param {string} filePath - Ruta del archivo XLSX
 * @returns {Array} Array de objetos con datos de pacientes
 */
function parseXLSX(filePath) {
  try {
    // Leer archivo
    const workbook = XLSX.readFile(filePath);

    // Obtener primera hoja
    const sheetName = workbook.SheetNames[0];
    const worksheet = workbook.Sheets[sheetName];

    // Convertir a JSON
    const data = XLSX.utils.sheet_to_json(worksheet);

    return data;
  } catch (error) {
    throw new Error(`Error parseando XLSX: ${error.message}`);
  }
}

/**
 * Validar y normalizar datos de fila
 * @param {Object} row - Fila de datos
 * @param {number} index - Índice de la fila (para mensajes de error)
 * @returns {Object} { valid: boolean, data?: Object, error?: string }
 */
function validateAndNormalizeRow(row, index) {
  try {
    // Normalizar nombres de columnas (case-insensitive)
    const normalized = {};
    for (const key in row) {
      normalized[key.toLowerCase().trim()] = row[key];
    }

    // Extraer campos (soportar variaciones de nombres)
    const nhc = normalized.nhc || normalized['nhc'] || normalized['numero historia clinica'];
    const diagnosticos = normalized.diagnosticos || normalized['diagnósticos'] || normalized['diagnostico'];
    const fecha = normalized.fecha || normalized['fecha_ultimo_seguimiento'] || normalized['fecha ultimo seguimiento'];

    // Validar que existan los campos requeridos
    if (!nhc) {
      return {
        valid: false,
        error: `Fila ${index + 1}: Campo NHC faltante`
      };
    }

    if (!diagnosticos) {
      return {
        valid: false,
        error: `Fila ${index + 1}: Campo Diagnosticos faltante`
      };
    }

    if (!fecha) {
      return {
        valid: false,
        error: `Fila ${index + 1}: Campo Fecha faltante`
      };
    }

    // Procesar diagnósticos (separados por comas)
    let diagnosticosArray;
    if (typeof diagnosticos === 'string') {
      diagnosticosArray = diagnosticos
        .split(',')
        .map(d => d.trim())
        .filter(d => d.length > 0);
    } else {
      diagnosticosArray = [String(diagnosticos).trim()];
    }

    // Validar códigos ORPHA
    const orphaRegex = /^ORPHA\.\d+$/;
    for (const diag of diagnosticosArray) {
      if (!orphaRegex.test(diag)) {
        return {
          valid: false,
          error: `Fila ${index + 1}: Código ORPHA inválido: ${diag}. Formato esperado: ORPHA.xxxx`
        };
      }
    }

    // Normalizar fecha
    let fechaNormalizada;
    if (typeof fecha === 'string') {
      fechaNormalizada = fecha.trim();
    } else if (typeof fecha === 'number') {
      // Excel guarda fechas como números
      const excelDate = XLSX.SSF.parse_date_code(fecha);
      fechaNormalizada = `${excelDate.y}-${String(excelDate.m).padStart(2, '0')}-${String(excelDate.d).padStart(2, '0')}`;
    } else {
      return {
        valid: false,
        error: `Fila ${index + 1}: Formato de fecha inválido`
      };
    }

    // Validar formato de fecha (YYYY-MM-DD)
    const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
    if (!dateRegex.test(fechaNormalizada)) {
      return {
        valid: false,
        error: `Fila ${index + 1}: Formato de fecha inválido. Use YYYY-MM-DD`
      };
    }

    // Validar que la fecha sea válida
    const dateObj = new Date(fechaNormalizada);
    if (isNaN(dateObj.getTime())) {
      return {
        valid: false,
        error: `Fila ${index + 1}: Fecha inválida: ${fechaNormalizada}`
      };
    }

    return {
      valid: true,
      data: {
        nhc: String(nhc).trim(),
        diagnosticos: diagnosticosArray,
        fecha_ultimo_seguimiento: fechaNormalizada
      }
    };
  } catch (error) {
    return {
      valid: false,
      error: `Fila ${index + 1}: Error procesando datos: ${error.message}`
    };
  }
}

/**
 * Procesar archivo completo
 * @param {string} filePath - Ruta del archivo
 * @param {string} fileType - Tipo de archivo ('csv' o 'xlsx')
 * @returns {Promise<Object>} { validRows: Array, errors: Array }
 */
async function processFile(filePath, fileType) {
  try {
    // Parsear según tipo de archivo
    let rawData;
    if (fileType === 'csv') {
      rawData = await parseCSV(filePath);
    } else if (fileType === 'xlsx') {
      rawData = parseXLSX(filePath);
    } else {
      throw new Error('Tipo de archivo no soportado');
    }

    const validRows = [];
    const errors = [];

    // Validar y normalizar cada fila
    rawData.forEach((row, index) => {
      const result = validateAndNormalizeRow(row, index);

      if (result.valid) {
        validRows.push(result.data);
      } else {
        errors.push({
          fila: index + 1,
          error: result.error
        });
      }
    });

    return { validRows, errors };
  } catch (error) {
    throw new Error(`Error procesando archivo: ${error.message}`);
  }
}

module.exports = {
  parseCSV,
  parseXLSX,
  validateAndNormalizeRow,
  processFile
};
