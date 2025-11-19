/**
 * API Service
 * Cliente HTTP configurado con Axios para comunicación con el backend
 */

import axios from 'axios';

// Crear instancia de axios con configuración base
const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000/api',
  headers: {
    'Content-Type': 'application/json'
  }
});

// Interceptor para añadir token JWT a todas las peticiones
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('token');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Interceptor para manejar errores de respuesta
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // El servidor respondió con un código de error
      if (error.response.status === 401) {
        // Token inválido o expirado - limpiar y redirigir a login
        localStorage.removeItem('token');
        localStorage.removeItem('user');
        window.location.href = '/login';
      }
    }
    return Promise.reject(error);
  }
);

// ============================================
// Auth API
// ============================================

export const authAPI = {
  login: (credentials) => api.post('/auth/login', credentials),
  logout: () => api.post('/auth/logout'),
  me: () => api.get('/auth/me')
};

// ============================================
// Users API
// ============================================

export const usersAPI = {
  getAll: () => api.get('/users'),
  getById: (id) => api.get(`/users/${id}`),
  create: (userData) => api.post('/users', userData),
  updatePassword: (id, newPassword) => api.put(`/users/${id}/password`, { newPassword }),
  delete: (id) => api.delete(`/users/${id}`)
};

// ============================================
// Patients API
// ============================================

export const patientsAPI = {
  getByNHC: (nhc) => api.get(`/patients/${nhc}`),
  getAll: (params) => api.get('/patients', { params }),
  getStats: () => api.get('/patients/stats'),
  getDiagnosisCodes: () => api.get('/patients/diagnosis-codes'),
  create: (patientData) => api.post('/patients', patientData),
  update: (nhc, patientData) => api.put(`/patients/${nhc}`, patientData)
};

// ============================================
// Import API
// ============================================

export const importAPI = {
  uploadFile: (file) => {
    const formData = new FormData();
    formData.append('file', file);

    return api.post('/import', formData, {
      headers: {
        'Content-Type': 'multipart/form-data'
      }
    });
  }
};

// ============================================
// Export API
// ============================================

export const exportAPI = {
  exportPatients: (params) => {
    return api.get('/export/patients', {
      params,
      responseType: 'blob' // Importante para descargar archivos
    });
  },
  exportStats: () => {
    return api.get('/export/stats', {
      responseType: 'blob'
    });
  }
};

export default api;
