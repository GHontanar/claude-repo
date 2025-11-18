/**
 * Import Routes
 * Rutas de importación de archivos (solo admin)
 */

const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const importController = require('../controllers/importController');
const { verifyToken } = require('../middleware/auth');
const { requireAdmin } = require('../middleware/roleCheck');

// Configurar multer para subida de archivos
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, '/tmp'); // Guardar en directorio temporal
  },
  filename: (req, file, cb) => {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, 'upload-' + uniqueSuffix + path.extname(file.originalname));
  }
});

const upload = multer({
  storage: storage,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 10 * 1024 * 1024 // 10MB por defecto
  },
  fileFilter: (req, file, cb) => {
    // Aceptar solo CSV y XLSX
    const ext = path.extname(file.originalname).toLowerCase();
    if (ext === '.csv' || ext === '.xlsx' || ext === '.xls') {
      cb(null, true);
    } else {
      cb(new Error('Solo se permiten archivos CSV o XLSX'));
    }
  }
});

// POST /api/import - Importar archivo CSV/XLSX
router.post('/',
  verifyToken,
  requireAdmin,
  upload.single('file'),
  importController.importFile
);

// Manejador de errores de multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({
        error: 'El archivo excede el tamaño máximo permitido (10MB)',
        code: 'FILE_TOO_LARGE'
      });
    }
    return res.status(400).json({
      error: 'Error subiendo archivo',
      details: error.message,
      code: 'UPLOAD_ERROR'
    });
  }

  if (error) {
    return res.status(400).json({
      error: error.message,
      code: 'UPLOAD_ERROR'
    });
  }

  next();
});

module.exports = router;
