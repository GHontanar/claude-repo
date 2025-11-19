/**
 * Utilidades de Nomenclatura ORPHA
 * Funciones para enriquecer datos de pacientes con nomenclatura legible
 */

const OrphaNomenclature = require('../models/OrphaNomenclature');
const { NOMENCLATURE, isPlaceholder } = require('../config/constants');

/**
 * Enriquecer pacientes con nomenclatura
 * Agrega el campo 'diagnosticosDetalle' con código y nombre para cada diagnóstico
 *
 * @param {Array|Object} patients - Paciente o array de pacientes
 * @returns {Promise<Array|Object>} Pacientes enriquecidos
 *
 * @example
 * // Input:
 * {
 *   nhc: "12345",
 *   diagnosticos: ["ORPHA.123", "ORPHA.456", "PENDIENTE"]
 * }
 *
 * // Output:
 * {
 *   nhc: "12345",
 *   diagnosticos: ["ORPHA.123", "ORPHA.456", "PENDIENTE"],
 *   diagnosticosDetalle: [
 *     { codigo: "ORPHA.123", nombre: "Fibrosis Quística", esPlaceholder: false },
 *     { codigo: "ORPHA.456", nombre: "Síndrome de Marfan", esPlaceholder: false },
 *     { codigo: "PENDIENTE", nombre: "Pendiente de Diagnóstico", esPlaceholder: true }
 *   ]
 * }
 */
async function enrichPatientsWithNomenclature(patients) {
  // Si es null o undefined, retornar como está
  if (!patients) return patients;

  // Normalizar a array
  const isArray = Array.isArray(patients);
  const patientsArray = isArray ? patients : [patients];

  // Si está vacío, retornar vacío
  if (patientsArray.length === 0) return patientsArray;

  try {
    // Extraer todos los códigos únicos de todos los pacientes
    const allCodes = new Set();
    patientsArray.forEach(patient => {
      if (Array.isArray(patient.diagnosticos)) {
        patient.diagnosticos.forEach(code => {
          if (code) allCodes.add(code);
        });
      }
    });

    // Obtener nomenclaturas en batch (una sola query para todos los códigos)
    const nomenclatureMap = await OrphaNomenclature.findByCodes([...allCodes]);

    // Enriquecer cada paciente
    const enrichedPatients = patientsArray.map(patient => {
      // Si no tiene diagnósticos, agregar array vacío
      if (!Array.isArray(patient.diagnosticos)) {
        return {
          ...patient,
          diagnosticos: [],
          diagnosticosDetalle: []
        };
      }

      // Crear detalle para cada diagnóstico
      const diagnosticosDetalle = patient.diagnosticos.map(codigo => ({
        codigo,
        nombre: nomenclatureMap[codigo] || NOMENCLATURE.NOT_FOUND_MESSAGE,
        esPlaceholder: isPlaceholder(codigo)
      }));

      return {
        ...patient,
        diagnosticosDetalle
      };
    });

    // Retornar en el formato original (array u objeto único)
    return isArray ? enrichedPatients : enrichedPatients[0];
  } catch (error) {
    console.error('Error enriqueciendo pacientes con nomenclatura:', error);

    // En caso de error, retornar pacientes sin enriquecer
    // pero con diagnosticosDetalle vacío para no romper el frontend
    const fallbackPatients = patientsArray.map(patient => ({
      ...patient,
      diagnosticosDetalle: (patient.diagnosticos || []).map(codigo => ({
        codigo,
        nombre: NOMENCLATURE.NOT_FOUND_MESSAGE,
        esPlaceholder: isPlaceholder(codigo)
      }))
    }));

    return isArray ? fallbackPatients : fallbackPatients[0];
  }
}

/**
 * Obtener nomenclatura de un código individual
 * @param {string} code - Código ORPHA
 * @returns {Promise<string>} Nombre de la enfermedad
 */
async function getNomenclature(code) {
  if (!code) return NOMENCLATURE.NOT_FOUND_MESSAGE;

  try {
    const result = await OrphaNomenclature.findByCode(code);
    return result ? result.nombre : NOMENCLATURE.NOT_FOUND_MESSAGE;
  } catch (error) {
    console.error(`Error obteniendo nomenclatura para ${code}:`, error);
    return NOMENCLATURE.NOT_FOUND_MESSAGE;
  }
}

/**
 * Obtener nomenclaturas de múltiples códigos
 * @param {Array<string>} codes - Array de códigos ORPHA
 * @returns {Promise<Object>} Mapa { code: nombre }
 */
async function getNomenclatures(codes) {
  if (!codes || codes.length === 0) return {};

  try {
    return await OrphaNomenclature.findByCodes(codes);
  } catch (error) {
    console.error('Error obteniendo nomenclaturas:', error);
    return {};
  }
}

/**
 * Validar que un código ORPHA existe en la nomenclatura
 * @param {string} code - Código ORPHA
 * @returns {Promise<boolean>} true si existe
 */
async function validateOrphaCode(code) {
  if (!code) return false;

  // Los placeholders son válidos
  if (isPlaceholder(code)) return true;

  try {
    const result = await OrphaNomenclature.findByCode(code);
    return result !== null;
  } catch (error) {
    console.error(`Error validando código ORPHA ${code}:`, error);
    return false;
  }
}

/**
 * Formatear código ORPHA al formato correcto
 * Convierte ORPHAXXXX a ORPHA.XXXX
 * @param {string} code - Código a formatear
 * @returns {string} Código formateado
 */
function formatOrphaCode(code) {
  if (!code || typeof code !== 'string') return code;

  // Si ya tiene el formato correcto, retornar como está
  if (/^ORPHA\.\d+$/.test(code)) return code;

  // Si tiene formato antiguo ORPHAXXXX, convertir a ORPHA.XXXX
  if (/^ORPHA\d+$/.test(code)) {
    return code.replace(/^ORPHA(\d+)$/, 'ORPHA.$1');
  }

  // Si es placeholder, retornar como está
  if (isPlaceholder(code)) return code;

  return code;
}

/**
 * Formatear array de códigos ORPHA
 * @param {Array<string>} codes - Array de códigos
 * @returns {Array<string>} Array de códigos formateados
 */
function formatOrphaCodes(codes) {
  if (!Array.isArray(codes)) return codes;
  return codes.map(formatOrphaCode);
}

module.exports = {
  enrichPatientsWithNomenclature,
  getNomenclature,
  getNomenclatures,
  validateOrphaCode,
  formatOrphaCode,
  formatOrphaCodes
};
