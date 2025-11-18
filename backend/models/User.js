/**
 * User Model
 * Maneja todas las operaciones de base de datos relacionadas con usuarios
 */

const pool = require('../config/database');
const bcrypt = require('bcrypt');

class User {
  /**
   * Buscar usuario por username
   * @param {string} username - Nombre de usuario
   * @returns {Object|null} Usuario encontrado o null
   */
  static async findByUsername(username) {
    try {
      const [rows] = await pool.execute(
        'SELECT id, username, password, rol, created_at FROM usuarios WHERE username = ?',
        [username]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error buscando usuario: ${error.message}`);
    }
  }

  /**
   * Buscar usuario por ID
   * @param {number} id - ID del usuario
   * @returns {Object|null} Usuario encontrado o null
   */
  static async findById(id) {
    try {
      const [rows] = await pool.execute(
        'SELECT id, username, rol, created_at, updated_at FROM usuarios WHERE id = ?',
        [id]
      );
      return rows[0] || null;
    } catch (error) {
      throw new Error(`Error buscando usuario por ID: ${error.message}`);
    }
  }

  /**
   * Obtener todos los usuarios (sin contraseñas)
   * @returns {Array} Lista de usuarios
   */
  static async findAll() {
    try {
      const [rows] = await pool.execute(
        'SELECT id, username, rol, created_at, updated_at FROM usuarios ORDER BY created_at DESC'
      );
      return rows;
    } catch (error) {
      throw new Error(`Error obteniendo usuarios: ${error.message}`);
    }
  }

  /**
   * Crear nuevo usuario
   * @param {Object} userData - Datos del usuario
   * @param {string} userData.username - Nombre de usuario
   * @param {string} userData.password - Contraseña en texto plano
   * @param {string} userData.rol - Rol del usuario (admin/usuario)
   * @returns {Object} Usuario creado
   */
  static async create({ username, password, rol = 'usuario' }) {
    try {
      // Hashear contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(password, saltRounds);

      // Insertar usuario
      const [result] = await pool.execute(
        'INSERT INTO usuarios (username, password, rol) VALUES (?, ?, ?)',
        [username, hashedPassword, rol]
      );

      // Retornar usuario creado (sin contraseña)
      return {
        id: result.insertId,
        username,
        rol,
        created_at: new Date()
      };
    } catch (error) {
      if (error.code === 'ER_DUP_ENTRY') {
        throw new Error('El username ya está en uso');
      }
      throw new Error(`Error creando usuario: ${error.message}`);
    }
  }

  /**
   * Actualizar contraseña de usuario
   * @param {number} id - ID del usuario
   * @param {string} newPassword - Nueva contraseña en texto plano
   * @returns {boolean} true si se actualizó correctamente
   */
  static async updatePassword(id, newPassword) {
    try {
      // Hashear nueva contraseña
      const saltRounds = 10;
      const hashedPassword = await bcrypt.hash(newPassword, saltRounds);

      // Actualizar contraseña
      const [result] = await pool.execute(
        'UPDATE usuarios SET password = ? WHERE id = ?',
        [hashedPassword, id]
      );

      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error actualizando contraseña: ${error.message}`);
    }
  }

  /**
   * Eliminar usuario
   * @param {number} id - ID del usuario
   * @returns {boolean} true si se eliminó correctamente
   */
  static async delete(id) {
    try {
      const [result] = await pool.execute(
        'DELETE FROM usuarios WHERE id = ?',
        [id]
      );
      return result.affectedRows > 0;
    } catch (error) {
      throw new Error(`Error eliminando usuario: ${error.message}`);
    }
  }

  /**
   * Verificar contraseña
   * @param {string} plainPassword - Contraseña en texto plano
   * @param {string} hashedPassword - Hash de la contraseña
   * @returns {boolean} true si la contraseña es correcta
   */
  static async verifyPassword(plainPassword, hashedPassword) {
    try {
      return await bcrypt.compare(plainPassword, hashedPassword);
    } catch (error) {
      throw new Error(`Error verificando contraseña: ${error.message}`);
    }
  }

  /**
   * Contar administradores
   * @returns {number} Número de administradores
   */
  static async countAdmins() {
    try {
      const [rows] = await pool.execute(
        'SELECT COUNT(*) as count FROM usuarios WHERE rol = "admin"'
      );
      return rows[0].count;
    } catch (error) {
      throw new Error(`Error contando administradores: ${error.message}`);
    }
  }
}

module.exports = User;
