/**
 * Authentication Middleware
 * Verifica JWT en las peticiones
 */

const jwt = require('jsonwebtoken');

/**
 * Middleware para verificar token JWT
 * Añade req.user con los datos del usuario si el token es válido
 */
const verifyToken = (req, res, next) => {
  try {
    // Obtener token del header Authorization
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({
        error: 'Token no proporcionado',
        code: 'NO_TOKEN'
      });
    }

    // Extraer token (formato: "Bearer <token>")
    const token = authHeader.split(' ')[1];

    // Verificar token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // Añadir datos del usuario al request
    req.user = {
      id: decoded.id,
      username: decoded.username,
      rol: decoded.rol
    };

    next();
  } catch (error) {
    if (error.name === 'JsonWebTokenError') {
      return res.status(401).json({
        error: 'Token inválido',
        code: 'INVALID_TOKEN'
      });
    }

    if (error.name === 'TokenExpiredError') {
      return res.status(401).json({
        error: 'Token expirado',
        code: 'EXPIRED_TOKEN'
      });
    }

    return res.status(500).json({
      error: 'Error verificando token',
      code: 'AUTH_ERROR'
    });
  }
};

module.exports = { verifyToken };
