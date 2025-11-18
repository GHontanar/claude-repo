/**
 * Auth Routes
 * Rutas de autenticación
 */

const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { verifyToken } = require('../middleware/auth');
const { validateLogin } = require('../middleware/validation');

// POST /api/auth/login - Iniciar sesión
router.post('/login', validateLogin, authController.login);

// POST /api/auth/logout - Cerrar sesión
router.post('/logout', verifyToken, authController.logout);

// GET /api/auth/me - Obtener usuario actual
router.get('/me', verifyToken, authController.me);

module.exports = router;
