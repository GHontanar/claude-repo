/**
 * Export Button Component
 * Botón reutilizable para exportar datos a XLSX
 */

import { useState } from 'react';
import { Button, CircularProgress } from '@mui/material';
import { Download } from '@mui/icons-material';
import { exportAPI } from '../../services/api';

export default function ExportButton({ params = {}, type = 'patients', label = 'Exportar a Excel', variant = 'contained' }) {
  const [loading, setLoading] = useState(false);

  const handleExport = async () => {
    setLoading(true);

    try {
      let response;

      if (type === 'patients') {
        response = await exportAPI.exportPatients(params);
      } else if (type === 'stats') {
        response = await exportAPI.exportStats();
      }

      // Crear blob y descargar archivo
      const blob = new Blob([response.data], {
        type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet'
      });

      const url = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;

      // Generar nombre de archivo
      const fecha = new Date().toISOString().split('T')[0];
      const filename = type === 'patients'
        ? `pacientes_${fecha}.xlsx`
        : `estadisticas_${fecha}.xlsx`;

      link.setAttribute('download', filename);
      document.body.appendChild(link);
      link.click();
      link.remove();

      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error('Error exportando:', error);
      alert('Error exportando datos. Por favor intente de nuevo.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Button
      variant={variant}
      color="success"
      startIcon={loading ? <CircularProgress size={20} color="inherit" /> : <Download />}
      onClick={handleExport}
      disabled={loading}
    >
      {loading ? 'Exportando...' : label}
    </Button>
  );
}
