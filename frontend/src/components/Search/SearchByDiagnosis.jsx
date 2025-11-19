/**
 * Search By Diagnosis Component
 * Búsqueda de pacientes por código ORPHA
 */

import { useState, useEffect } from 'react';
import {
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Autocomplete
} from '@mui/material';
import { Search, LocalHospital } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { patientsAPI } from '../../services/api';
import ExportButton from '../Common/ExportButton';

export default function SearchByDiagnosis() {
  const [diagnostico, setDiagnostico] = useState('');
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);
  const [availableCodes, setAvailableCodes] = useState([]);
  const [loadingCodes, setLoadingCodes] = useState(true);

  // Cargar códigos ORPHA disponibles al montar el componente
  useEffect(() => {
    const fetchCodes = async () => {
      try {
        const response = await patientsAPI.getDiagnosisCodes();
        setAvailableCodes(response.data.codes || []);
      } catch (err) {
        console.error('Error cargando códigos ORPHA:', err);
      } finally {
        setLoadingCodes(false);
      }
    };

    fetchCodes();
  }, []);

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!diagnostico.trim()) {
      setError('Por favor ingrese un código ORPHA');
      return;
    }

    // Validar formato ORPHA
    if (!/^ORPHA\d+$/i.test(diagnostico.trim())) {
      setError('Formato inválido. Use: ORPHAxxxx (ej: ORPHA123)');
      return;
    }

    setError('');
    setLoading(true);
    setSearched(true);

    try {
      const response = await patientsAPI.getAll({
        diagnostico: diagnostico.trim().toUpperCase()
      });
      setPatients(response.data.patients || []);
    } catch (err) {
      setError('Error buscando pacientes. Por favor intente de nuevo.');
      setPatients([]);
    } finally {
      setLoading(false);
    }
  };

  const columns = [
    {
      field: 'nhc',
      headerName: 'NHC',
      width: 150,
      headerAlign: 'center',
      align: 'center'
    },
    {
      field: 'diagnosticos',
      headerName: 'Diagnósticos',
      flex: 1,
      minWidth: 300,
      renderCell: (params) => (
        <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, py: 1 }}>
          {params.value.map((diag, index) => (
            <Chip
              key={index}
              label={diag}
              size="small"
              color={diag === diagnostico.trim().toUpperCase() ? 'primary' : 'default'}
            />
          ))}
        </Box>
      )
    },
    {
      field: 'fecha_ultimo_seguimiento',
      headerName: 'Último Seguimiento',
      width: 200,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (params) => {
        return new Date(params.value).toLocaleDateString('es-ES');
      }
    }
  ];

  return (
    <Box>
      <Typography variant="h5" gutterBottom sx={{ mb: 3 }}>
        <LocalHospital sx={{ verticalAlign: 'middle', mr: 1 }} />
        Buscar Pacientes por Diagnóstico
      </Typography>

      <Paper sx={{ p: 3, mb: 3 }}>
        <Box component="form" onSubmit={handleSearch} sx={{ display: 'flex', gap: 2 }}>
          <Autocomplete
            freeSolo
            options={availableCodes}
            value={diagnostico}
            onChange={(event, newValue) => {
              setDiagnostico(newValue || '');
            }}
            onInputChange={(event, newInputValue) => {
              setDiagnostico(newInputValue);
            }}
            loading={loadingCodes}
            disabled={loading}
            fullWidth
            renderInput={(params) => (
              <TextField
                {...params}
                label="Código ORPHA"
                placeholder="Ej: ORPHA123"
                helperText={loadingCodes ? "Cargando códigos disponibles..." : `${availableCodes.length} códigos disponibles`}
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingCodes ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
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

      {searched && !loading && (
        <Paper sx={{ p: 3 }}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
            <Typography variant="h6">
              Resultados: {patients.length} paciente(s)
            </Typography>

            {patients.length > 0 && (
              <ExportButton
                params={{ diagnostico: diagnostico.trim().toUpperCase() }}
                type="patients"
                label="Exportar Resultados"
              />
            )}
          </Box>

          {patients.length === 0 ? (
            <Alert severity="info">
              No se encontraron pacientes con el diagnóstico {diagnostico.trim().toUpperCase()}
            </Alert>
          ) : (
            <Box sx={{ height: 600 }}>
              <DataGrid
                rows={patients}
                columns={columns}
                getRowId={(row) => row.nhc}
                pageSize={10}
                rowsPerPageOptions={[10, 25, 50]}
                disableSelectionOnClick
                rowHeight={60}
              />
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}
