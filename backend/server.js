/**
 * Server Entry Point
 * Servidor Express para Patient Tracking System
 */

const express = require('express');
const cors = require('cors');
require('dotenv').config();

// Importar rutas
const authRoutes = require('./routes/auth');
const userRoutes = require('./routes/users');
const patientRoutes = require('./routes/patients');
const importRoutes = require('./routes/import');
const exportRoutes = require('./routes/export');
const nomenclatureRoutes = require('./routes/nomenclature');

// Crear aplicación Express
const app = express();
const PORT = process.env.PORT || 3000;

// =====================================================
// Middlewares
// =====================================================

// CORS - Permitir requests desde frontend
app.use(cors({
  origin: process.env.FRONTEND_URL || 'http://localhost:5173',
  credentials: true
}));

// Parser JSON
app.use(express.json());

// Parser URL-encoded
app.use(express.urlencoded({ extended: true }));

// Logging simple de requests (desarrollo)
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`${new Date().toISOString()} - ${req.method} ${req.path}`);
    next();
  });
}

// =====================================================
// Rutas
// =====================================================

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'ok',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// Rutas de la API
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/api/patients', patientRoutes);
app.use('/api/import', importRoutes);
app.use('/api/export', exportRoutes);
app.use('/api/nomenclature', nomenclatureRoutes);

// Ruta por defecto (404)
app.use('*', (req, res) => {
  res.status(404).json({
    error: 'Endpoint no encontrado',
    path: req.originalUrl
  });
});

// =====================================================
// Manejador global de errores
// =====================================================

app.use((err, req, res, next) => {
  console.error('Error no manejado:', err);

  res.status(err.status || 500).json({
    error: err.message || 'Error interno del servidor',
    code: err.code || 'INTERNAL_ERROR',
    ...(process.env.NODE_ENV !== 'production' && { stack: err.stack })
  });
});

// =====================================================
// Iniciar servidor
// =====================================================

app.listen(PORT, () => {
  console.log('╔═══════════════════════════════════════════════════════╗');
  console.log('║   Patient Tracking System - Backend API              ║');
  console.log('╚═══════════════════════════════════════════════════════╝');
  console.log('');
  console.log(`✓ Servidor corriendo en puerto ${PORT}`);
  console.log(`✓ Entorno: ${process.env.NODE_ENV || 'development'}`);
  console.log(`✓ CORS habilitado para: ${process.env.FRONTEND_URL || 'http://localhost:5173'}`);
  console.log('');
  console.log('Endpoints disponibles:');
  console.log(`  - GET  ${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/health`);
  console.log(`  - POST ${process.env.FRONTEND_URL || 'http://localhost:3000'}/api/auth/login`);
  console.log('');
  console.log('Presiona Ctrl+C para detener el servidor');
  console.log('');
});

// Manejo de señales de terminación
process.on('SIGTERM', () => {
  console.log('SIGTERM recibido, cerrando servidor...');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('\nSIGINT recibido, cerrando servidor...');
  process.exit(0);
});

module.exports = app;
