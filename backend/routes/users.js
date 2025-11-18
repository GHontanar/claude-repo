/**
 * Users Routes
 * Rutas de gestión de usuarios (solo admin)
 */

const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');
const { validateUserCreation, validatePasswordUpdate } = require('../middleware/validation');

// Todas las rutas requieren autenticación y rol de admin
router.use(verifyToken, requireAdmin);

// GET /api/users - Obtener todos los usuarios
router.get('/', userController.getAll);

// GET /api/users/:id - Obtener usuario por ID
router.get('/:id', userController.getById);

// POST /api/users - Crear nuevo usuario
router.post('/', validateUserCreation, userController.create);

// PUT /api/users/:id/password - Cambiar contraseña de usuario
router.put('/:id/password', validatePasswordUpdate, userController.updatePassword);

// DELETE /api/users/:id - Eliminar usuario
router.delete('/:id', userController.delete);

module.exports = router;
