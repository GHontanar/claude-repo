/**
 * Role Check Middleware
 * Verifica que el usuario tenga el rol adecuado
 */

/**
 * Middleware para verificar que el usuario es administrador
 * Debe usarse después del middleware verifyToken
 */
const requireAdmin = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Usuario no autenticado',
      code: 'NOT_AUTHENTICATED'
    });
  }

  if (req.user.rol !== 'admin') {
    return res.status(403).json({
      error: 'Acceso denegado: requiere rol de administrador',
      code: 'FORBIDDEN',
      required_role: 'admin'
    });
  }

  next();
};

/**
 * Middleware para verificar que el usuario está autenticado (cualquier rol)
 * Más descriptivo que solo verifyToken para ciertos endpoints
 */
const requireAuth = (req, res, next) => {
  if (!req.user) {
    return res.status(401).json({
      error: 'Usuario no autenticado',
      code: 'NOT_AUTHENTICATED'
    });
  }

  next();
};

module.exports = { requireAdmin, requireAuth };
