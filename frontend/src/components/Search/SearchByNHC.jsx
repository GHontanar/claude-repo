/**
 * Search By NHC Component
 * Búsqueda de paciente por Número de Historia Clínica
 */

import { useState } from 'react';
import {
  Paper,
  TextField,
  Button,
  Box,
  Card,
  CardContent,
  Typography,
  Chip,
  Alert,
  CircularProgress
} from '@mui/material';
import { Search, Person } from '@mui/icons-material';
import { patientsAPI } from '../../services/api';

export default function SearchByNHC() {
  const [nhc, setNhc] = useState('');
  const [patient, setPatient] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!nhc.trim()) {
      setError('Por favor ingrese un NHC');
      return;
    }

    setError('');
    setLoading(true);
    setPatient(null);

    try {
      const response = await patientsAPI.getByNHC(nhc.trim());
      setPatient(response.data);
    } catch (err) {
      if (err.response?.status === 404) {
        setError('Paciente no encontrado');
      } else {
        setError('Error buscando paciente. Por favor intente de nuevo.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        <Person sx={{ verticalAlign: 'middle', mr: 1 }} />
        Buscar Paciente por NHC
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2 }}>
          <TextField
            label="Número de Historia Clínica (NHC)"
            value={nhc}
            onChange={(e) => setNhc(e.target.value)}
            fullWidth
            placeholder="Ej: 12345"
            disabled={loading}
          />

          <Button
            type="submit"
            variant="contained"
            startIcon={loading ? <CircularProgress size={20} /> : <Search />}
            disabled={loading}
            sx={{ minWidth: 150 }}
          >
            {loading ? 'Buscando...' : 'Buscar'}
          </Button>
        </Box>
      </Paper>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      {patient && (
        <Card>
          <CardContent>
            <Typography variant="h6" gutterBottom color="primary">
              Paciente Encontrado
            </Typography>

            <Box sx={{ mt: 2 }}>
              <Typography variant="body2" color="text.secondary" gutterBottom>
                NHC
              </Typography>
              <Typography variant="h5" gutterBottom>
                {patient.nhc}
              </Typography>

              <Typography variant="body2" color="text.secondary" gutterBottom sx={{ mt: 3 }}>
                Diagnósticos
              </Typography>
              <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 1, mb: 3 }}>
                {patient.diagnosticos.map((diag, index) => (
                  <Chip
                    key={index}
                    label={diag}
                    color="primary"
                    variant="outlined"
                  />
                ))}
              </Box>

              <Typography variant="body2" color="text.secondary" gutterBottom>
                Fecha de Último Seguimiento
              </Typography>
              <Typography variant="h6">
                {new Date(patient.fecha_ultimo_seguimiento).toLocaleDateString('es-ES', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}
              </Typography>

              <Box sx={{ mt: 3, pt: 2, borderTop: 1, borderColor: 'divider' }}>
                <Typography variant="caption" color="text.secondary">
                  Registro creado: {new Date(patient.created_at).toLocaleDateString('es-ES')}
                </Typography>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}
    </Box>
  );
}
