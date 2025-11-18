/**
 * Database Configuration
 * MySQL connection pool setup
 */

const mysql = require('mysql2/promise');
require('dotenv').config();

// Crear pool de conexiones
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'hospital_app',
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME || 'hospital_patients',
  waitForConnections: true,
  connectionLimit: 10, // Máximo 10 conexiones simultáneas
  queueLimit: 0, // Sin límite de cola
  enableKeepAlive: true,
  keepAliveInitialDelay: 0
});

// Verificar conexión al iniciar
pool.getConnection()
  .then(connection => {
    console.log('✓ Conexión a MySQL exitosa');
    connection.release();
  })
  .catch(err => {
    console.error('✗ Error conectando a MySQL:', err.message);
    process.exit(1);
  });

module.exports = pool;
