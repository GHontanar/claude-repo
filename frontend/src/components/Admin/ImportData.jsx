/**
 * Import Data Component
 * Importación de archivos CSV/XLSX (Solo Admin)
 */

import { useState } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Alert,
  CircularProgress,
  Card,
  CardContent,
  List,
  ListItem,
  ListItemText,
  Divider
} from '@mui/material';
import { Upload, CloudUpload } from '@mui/icons-material';
import { importAPI } from '../../services/api';

export default function ImportData() {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState('');

  const handleFileChange = (event) => {
    const selectedFile = event.target.files[0];

    if (selectedFile) {
      const ext = selectedFile.name.split('.').pop().toLowerCase();

      if (ext !== 'csv' && ext !== 'xlsx' && ext !== 'xls') {
        setError('Solo se permiten archivos CSV o XLSX');
        setFile(null);
        return;
      }

      if (selectedFile.size > 10 * 1024 * 1024) {
        setError('El archivo excede el tamaño máximo (10MB)');
        setFile(null);
        return;
      }

      setFile(selectedFile);
      setError('');
      setResult(null);
    }
  };

  const handleUpload = async () => {
    if (!file) {
      setError('Por favor seleccione un archivo');
      return;
    }

    setLoading(true);
    setError('');
    setResult(null);

    try {
      const response = await importAPI.uploadFile(file);
      setResult(response.data);
      setFile(null);

      // Resetear input
      document.getElementById('file-upload').value = '';
    } catch (err) {
      setError(err.response?.data?.error || 'Error importando archivo');
      console.error('Import error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        <Upload sx={{ verticalAlign: 'middle', mr: 1 }} />
        Importar Datos de Pacientes
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Instrucciones
        </Typography>

        <Typography variant="body2" paragraph>
          El archivo debe contener las siguientes columnas:
        </Typography>

        <List dense>
          <ListItem>
            <ListItemText
              primary="NHC"
              secondary="Número de Historia Clínica del paciente"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Diagnosticos"
              secondary="Códigos ORPHA separados por comas (ej: ORPHA123,ORPHA456)"
            />
          </ListItem>
          <ListItem>
            <ListItemText
              primary="Fecha"
              secondary="Fecha de último seguimiento (formato: YYYY-MM-DD)"
            />
          </ListItem>
        </List>

        <Alert severity="info" sx={{ mt: 2 }}>
          El sistema actualizará automáticamente pacientes existentes y creará nuevos registros según sea necesario.
        </Alert>
      </Paper>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h6" gutterBottom>
          Subir Archivo
        </Typography>

        <Box sx={{ display: 'flex', gap: 2, alignItems: 'center', mt: 2 }}>
          <input
            accept=".csv,.xlsx,.xls"
            style={{ display: 'none' }}
            id="file-upload"
            type="file"
            onChange={handleFileChange}
            disabled={loading}
          />

          <label htmlFor="file-upload">
            <Button
              variant="outlined"
              component="span"
              startIcon={<CloudUpload />}
              disabled={loading}
            >
              Seleccionar Archivo
            </Button>
          </label>

          {file && (
            <Typography variant="body2">
              {file.name} ({(file.size / 1024).toFixed(2)} KB)
            </Typography>
          )}
        </Box>

        <Button
          variant="contained"
          onClick={handleUpload}
          disabled={!file || loading}
          startIcon={loading ? <CircularProgress size={20} /> : <Upload />}
          sx={{ mt: 2 }}
        >
          {loading ? 'Importando...' : 'Importar'}
        </Button>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {result && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="success.main">
              Importación Completada
            </Typography>

            <List>
              <ListItem>
                <ListItemText
                  primary="Total de Filas Procesadas"
                  secondary={result.summary?.total_filas || 0}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Pacientes Nuevos"
                  secondary={result.summary?.pacientes_nuevos || 0}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Pacientes Actualizados"
                  secondary={result.summary?.pacientes_actualizados || 0}
                />
              </ListItem>
              <ListItem>
                <ListItemText
                  primary="Errores"
                  secondary={result.summary?.errores || 0}
                />
              </ListItem>
            </List>

            {result.errores_detalle && result.errores_detalle.length > 0 && (
              <>
                <Divider sx={{ my: 2 }} />
                <Typography variant="subtitle2" color="error" gutterBottom>
                  Errores Encontrados:
                </Typography>
                <List dense>
                  {result.errores_detalle.slice(0, 10).map((err, index) => (
                    <ListItem key={index}>
                      <ListItemText
                        primary={`Fila ${err.fila}`}
                        secondary={err.error}
                      />
                    </ListItem>
                  ))}
                  {result.errores_detalle.length > 10 && (
                    <ListItem>
                      <ListItemText
                        secondary={`... y ${result.errores_detalle.length - 10} errores más`}
                      />
                    </ListItem>
                  )}
                </List>
              </>
            )}
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
