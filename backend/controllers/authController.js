/**
 * Auth Controller
 * Maneja autenticación y autorización
 */

const jwt = require('jsonwebtoken');
const User = require('../models/User');

/**
 * Login de usuario
 * POST /api/auth/login
 */
exports.login = async (req, res) => {
  try {
    const { username, password } = req.body;

    // Buscar usuario
    const user = await User.findByUsername(username);

    if (!user) {
      return res.status(401).json({
        error: 'Usuario o contraseña incorrectos'
      });
    }

    // Verificar contraseña
    const isPasswordValid = await User.verifyPassword(password, user.password);

    if (!isPasswordValid) {
      return res.status(401).json({
        error: 'Usuario o contraseña incorrectos'
      });
    }

    // Generar token JWT
    const token = jwt.sign(
      {
        id: user.id,
        username: user.username,
        rol: user.rol
      },
      process.env.JWT_SECRET,
      { expiresIn: '8h' } // Token expira en 8 horas
    );

    // Retornar token y datos del usuario (sin contraseña)
    res.json({
      token,
      user: {
        id: user.id,
        username: user.username,
        rol: user.rol
      }
    });
  } catch (error) {
    console.error('Error en login:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Logout (cliente debe eliminar el token)
 * POST /api/auth/logout
 */
exports.logout = (req, res) => {
  // En un sistema stateless con JWT, el logout se maneja en el cliente
  // eliminando el token del localStorage
  res.json({
    message: 'Sesión cerrada correctamente'
  });
};

/**
 * Obtener información del usuario actual
 * GET /api/auth/me
 */
exports.me = async (req, res) => {
  try {
    // req.user viene del middleware verifyToken
    const user = await User.findById(req.user.id);

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Error obteniendo usuario actual:', error);
    res.status(500).json({
      error: 'Error en el servidor',
      code: 'SERVER_ERROR'
    });
  }
};
