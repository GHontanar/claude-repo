/**
 * User Controller
 * Maneja operaciones CRUD de usuarios (solo admin)
 */

const User = require('../models/User');

/**
 * Obtener todos los usuarios
 * GET /api/users
 */
exports.getAll = async (req, res) => {
  try {
    const users = await User.findAll();
    res.json({ users });
  } catch (error) {
    console.error('Error obteniendo usuarios:', error);
    res.status(500).json({
      error: 'Error obteniendo usuarios',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Obtener un usuario por ID
 * GET /api/users/:id
 */
exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const user = await User.findById(parseInt(id));

    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    res.json(user);
  } catch (error) {
    console.error('Error obteniendo usuario:', error);
    res.status(500).json({
      error: 'Error obteniendo usuario',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Crear nuevo usuario
 * POST /api/users
 */
exports.create = async (req, res) => {
  try {
    const { username, password, rol } = req.body;

    const newUser = await User.create({ username, password, rol });

    res.status(201).json({
      message: 'Usuario creado correctamente',
      user: newUser
    });
  } catch (error) {
    console.error('Error creando usuario:', error);

    if (error.message === 'El username ya está en uso') {
      return res.status(409).json({
        error: error.message,
        field: 'username',
        code: 'DUPLICATE_USERNAME'
      });
    }

    res.status(500).json({
      error: 'Error creando usuario',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Actualizar contraseña de usuario
 * PUT /api/users/:id/password
 */
exports.updatePassword = async (req, res) => {
  try {
    const { id } = req.params;
    const { newPassword } = req.body;

    // Verificar que el usuario existe
    const user = await User.findById(parseInt(id));
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    // Actualizar contraseña
    const updated = await User.updatePassword(parseInt(id), newPassword);

    if (!updated) {
      return res.status(500).json({
        error: 'Error actualizando contraseña'
      });
    }

    res.json({
      message: 'Contraseña actualizada correctamente'
    });
  } catch (error) {
    console.error('Error actualizando contraseña:', error);
    res.status(500).json({
      error: 'Error actualizando contraseña',
      code: 'SERVER_ERROR'
    });
  }
};

/**
 * Eliminar usuario
 * DELETE /api/users/:id
 */
exports.delete = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = parseInt(id);

    // Verificar que el usuario existe
    const user = await User.findById(userId);
    if (!user) {
      return res.status(404).json({
        error: 'Usuario no encontrado'
      });
    }

    // No permitir que un admin se elimine a sí mismo
    if (userId === req.user.id) {
      return res.status(400).json({
        error: 'No puede eliminar su propio usuario',
        code: 'CANNOT_DELETE_SELF'
      });
    }

    // No permitir eliminar el último admin
    if (user.rol === 'admin') {
      const adminCount = await User.countAdmins();
      if (adminCount <= 1) {
        return res.status(400).json({
          error: 'No se puede eliminar el último administrador del sistema',
          code: 'LAST_ADMIN'
        });
      }
    }

    // Eliminar usuario
    const deleted = await User.delete(userId);

    if (!deleted) {
      return res.status(500).json({
        error: 'Error eliminando usuario'
      });
    }

    res.json({
      message: 'Usuario eliminado correctamente'
    });
  } catch (error) {
    console.error('Error eliminando usuario:', error);
    res.status(500).json({
      error: 'Error eliminando usuario',
      code: 'SERVER_ERROR'
    });
  }
};
