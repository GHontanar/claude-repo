/**
 * Validation Middleware
 * Validación de datos de entrada
 */

/**
 * Validar datos de login
 */
const validateLogin = (req, res, next) => {
  const { username, password } = req.body;

  if (!username || !password) {
    return res.status(400).json({
      error: 'Username y password son requeridos',
      code: 'VALIDATION_ERROR'
    });
  }

  if (typeof username !== 'string' || typeof password !== 'string') {
    return res.status(400).json({
      error: 'Username y password deben ser cadenas de texto',
      code: 'VALIDATION_ERROR'
    });
  }

  next();
};

/**
 * Validar datos de creación de usuario
 */
const validateUserCreation = (req, res, next) => {
  const { username, password, rol } = req.body;

  // Campos requeridos
  if (!username || !password) {
    return res.status(400).json({
      error: 'Username y password son requeridos',
      code: 'VALIDATION_ERROR'
    });
  }

  // Validar username
  if (username.length < 3 || username.length > 50) {
    return res.status(400).json({
      error: 'El username debe tener entre 3 y 50 caracteres',
      code: 'VALIDATION_ERROR',
      field: 'username'
    });
  }

  // Validar que username solo contenga caracteres alfanuméricos y guiones bajos
  if (!/^[a-zA-Z0-9_]+$/.test(username)) {
    return res.status(400).json({
      error: 'El username solo puede contener letras, números y guiones bajos',
      code: 'VALIDATION_ERROR',
      field: 'username'
    });
  }

  // Validar password (mínimo 8 caracteres, al menos 1 mayúscula y 1 número)
  if (password.length < 8) {
    return res.status(400).json({
      error: 'La contraseña debe tener al menos 8 caracteres',
      code: 'VALIDATION_ERROR',
      field: 'password'
    });
  }

  if (!/[A-Z]/.test(password)) {
    return res.status(400).json({
      error: 'La contraseña debe contener al menos una letra mayúscula',
      code: 'VALIDATION_ERROR',
      field: 'password'
    });
  }

  if (!/[0-9]/.test(password)) {
    return res.status(400).json({
      error: 'La contraseña debe contener al menos un número',
      code: 'VALIDATION_ERROR',
      field: 'password'
    });
  }

  // Validar rol (si se proporciona)
  if (rol && !['admin', 'usuario'].includes(rol)) {
    return res.status(400).json({
      error: 'El rol debe ser "admin" o "usuario"',
      code: 'VALIDATION_ERROR',
      field: 'rol'
    });
  }

  next();
};

/**
 * Validar actualización de contraseña
 */
const validatePasswordUpdate = (req, res, next) => {
  const { newPassword } = req.body;

  if (!newPassword) {
    return res.status(400).json({
      error: 'La nueva contraseña es requerida',
      code: 'VALIDATION_ERROR'
    });
  }

  // Mismas validaciones que en creación
  if (newPassword.length < 8) {
    return res.status(400).json({
      error: 'La contraseña debe tener al menos 8 caracteres',
      code: 'VALIDATION_ERROR',
      field: 'newPassword'
    });
  }

  if (!/[A-Z]/.test(newPassword)) {
    return res.status(400).json({
      error: 'La contraseña debe contener al menos una letra mayúscula',
      code: 'VALIDATION_ERROR',
      field: 'newPassword'
    });
  }

  if (!/[0-9]/.test(newPassword)) {
    return res.status(400).json({
      error: 'La contraseña debe contener al menos un número',
      code: 'VALIDATION_ERROR',
      field: 'newPassword'
    });
  }

  next();
};

/**
 * Validar NHC
 */
const validateNHC = (req, res, next) => {
  const { nhc } = req.params;

  if (!nhc || nhc.trim() === '') {
    return res.status(400).json({
      error: 'NHC es requerido',
      code: 'VALIDATION_ERROR'
    });
  }

  next();
};

/**
 * Validar datos de paciente
 */
const validatePatientData = (req, res, next) => {
  const { nhc, diagnosticos, fecha_ultimo_seguimiento } = req.body;

  // Validar NHC
  if (!nhc || nhc.trim() === '') {
    return res.status(400).json({
      error: 'NHC es requerido',
      code: 'VALIDATION_ERROR',
      field: 'nhc'
    });
  }

  // Validar diagnósticos
  if (!diagnosticos || !Array.isArray(diagnosticos) || diagnosticos.length === 0) {
    return res.status(400).json({
      error: 'Diagnósticos debe ser un array no vacío',
      code: 'VALIDATION_ERROR',
      field: 'diagnosticos'
    });
  }

  // Validar que todos los diagnósticos sean códigos ORPHA válidos
  const orphaRegex = /^ORPHA\.\d+$/;
  for (const diag of diagnosticos) {
    if (!orphaRegex.test(diag)) {
      return res.status(400).json({
        error: `Código ORPHA inválido: ${diag}. Formato esperado: ORPHA.xxxx`,
        code: 'VALIDATION_ERROR',
        field: 'diagnosticos'
      });
    }
  }

  // Validar fecha
  if (!fecha_ultimo_seguimiento) {
    return res.status(400).json({
      error: 'Fecha de último seguimiento es requerida',
      code: 'VALIDATION_ERROR',
      field: 'fecha_ultimo_seguimiento'
    });
  }

  // Validar formato de fecha (YYYY-MM-DD)
  const dateRegex = /^\d{4}-\d{2}-\d{2}$/;
  if (!dateRegex.test(fecha_ultimo_seguimiento)) {
    return res.status(400).json({
      error: 'Formato de fecha inválido. Use YYYY-MM-DD',
      code: 'VALIDATION_ERROR',
      field: 'fecha_ultimo_seguimiento'
    });
  }

  // Validar que la fecha sea válida
  const date = new Date(fecha_ultimo_seguimiento);
  if (isNaN(date.getTime())) {
    return res.status(400).json({
      error: 'Fecha inválida',
      code: 'VALIDATION_ERROR',
      field: 'fecha_ultimo_seguimiento'
    });
  }

  next();
};

module.exports = {
  validateLogin,
  validateUserCreation,
  validatePasswordUpdate,
  validateNHC,
  validatePatientData
};
