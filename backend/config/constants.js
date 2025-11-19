/**
 * Constantes del Sistema
 * Define códigos especiales, límites y configuraciones globales
 */

module.exports = {
  // =====================================================
  // CÓDIGOS PLACEHOLDER
  // =====================================================

  /**
   * Códigos especiales para pacientes sin diagnóstico
   * Estos códigos se eliminan automáticamente cuando se asigna un código ORPHA real
   */
  PLACEHOLDER_CODES: ['PENDIENTE', ''],

  /**
   * Verifica si un código es un placeholder
   * @param {string} code - Código a verificar
   * @returns {boolean} true si es placeholder
   */
  isPlaceholder: function(code) {
    return this.PLACEHOLDER_CODES.includes(code);
  },

  /**
   * Verifica si un código es ORPHA real
   * @param {string} code - Código a verificar
   * @returns {boolean} true si es código ORPHA válido
   */
  isRealOrphaCode: function(code) {
    return code && code.startsWith('ORPHA.') && /^ORPHA\.\d{1,6}$/.test(code);
  },

  // =====================================================
  // CONFIGURACIÓN DE NOMENCLATURA
  // =====================================================

  NOMENCLATURE: {
    // Mensaje por defecto cuando no se encuentra nomenclatura
    NOT_FOUND_MESSAGE: 'Código no encontrado',

    // Límite de resultados en autocomplete
    AUTOCOMPLETE_LIMIT: 20,

    // Límite de resultados en búsquedas generales
    SEARCH_LIMIT: 100,

    // Fuentes de nomenclatura
    SOURCES: {
      ORPHANET: 'Orphanet',
      SYSTEM: 'Sistema',
      MANUAL: 'Manual'
    }
  },

  // =====================================================
  // CONFIGURACIÓN DE PAGINACIÓN
  // =====================================================

  PAGINATION: {
    // Límite por defecto para listados
    DEFAULT_LIMIT: 100,

    // Límite máximo permitido
    MAX_LIMIT: 1000,

    // Offset por defecto
    DEFAULT_OFFSET: 0
  },

  // =====================================================
  // CONFIGURACIÓN DE JWT
  // =====================================================

  JWT: {
    // Duración del token (8 horas)
    EXPIRATION: '8h',

    // Roles válidos
    ROLES: {
      ADMIN: 'admin',
      USER: 'usuario'
    }
  },

  // =====================================================
  // CONFIGURACIÓN DE IMPORTACIÓN
  // =====================================================

  IMPORT: {
    // Tamaño máximo de archivo (10MB)
    MAX_FILE_SIZE: 10 * 1024 * 1024,

    // Formatos permitidos
    ALLOWED_FORMATS: ['.csv', '.xlsx'],

    // Tamaño de lote para importación
    BATCH_SIZE: 100
  },

  // =====================================================
  // CONFIGURACIÓN DE EXPORTACIÓN
  // =====================================================

  EXPORT: {
    // Nombre por defecto del archivo
    DEFAULT_FILENAME: 'pacientes_export',

    // Límite máximo de registros por exportación
    MAX_RECORDS: 10000
  },

  // =====================================================
  // MENSAJES DEL SISTEMA
  // =====================================================

  MESSAGES: {
    // Errores
    ERRORS: {
      PATIENT_NOT_FOUND: 'Paciente no encontrado',
      INVALID_NHC: 'NHC inválido',
      INVALID_ORPHA_CODE: 'Código ORPHA inválido',
      UNAUTHORIZED: 'No autorizado',
      FORBIDDEN: 'Acceso denegado',
      INTERNAL_ERROR: 'Error interno del servidor'
    },

    // Éxitos
    SUCCESS: {
      PATIENT_CREATED: 'Paciente creado exitosamente',
      PATIENT_UPDATED: 'Paciente actualizado exitosamente',
      IMPORT_COMPLETED: 'Importación completada',
      EXPORT_COMPLETED: 'Exportación completada'
    }
  }
};
