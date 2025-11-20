/**
 * Search By Diagnosis Component
 * Búsqueda de pacientes por código ORPHA con autocomplete inteligente
 */

import { useState } from 'react';
import {
  Paper,
  TextField,
  Button,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Autocomplete,
  Tooltip
} from '@mui/material';
import { Search, LocalHospital, Info as InfoIcon } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import api from '../../services/api';
import ExportButton from '../Common/ExportButton';

export default function SearchByDiagnosis() {
  const [selectedCode, setSelectedCode] = useState(null);
  const [inputValue, setInputValue] = useState('');
  const [options, setOptions] = useState([]);
  const [patients, setPatients] = useState([]);
  const [loading, setLoading] = useState(false);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [error, setError] = useState('');
  const [searched, setSearched] = useState(false);

  // Función de búsqueda de nomenclatura con debounce
  const searchNomenclature = async (query) => {
    if (query.length < 2) {
      setOptions([]);
      return;
    }

    setLoadingOptions(true);
    try {
      const response = await api.get(`/nomenclature/search?q=${encodeURIComponent(query)}`);
      setOptions(response.data || []);
    } catch (err) {
      console.error('Error buscando nomenclatura:', err);
      setOptions([]);
    } finally {
      setLoadingOptions(false);
    }
  };

  // Manejar cambio de input con debounce simple
  const handleInputChange = (event, newInputValue) => {
    setInputValue(newInputValue);

    // Debounce simple con timeout
    const timeoutId = setTimeout(() => {
      searchNomenclature(newInputValue);
    }, 300);

    // Limpiar timeout previo
    return () => clearTimeout(timeoutId);
  };

  const handleSearch = async (e) => {
    e.preventDefault();

    if (!selectedCode && !inputValue.trim()) {
      setError('Por favor seleccione o ingrese un código ORPHA');
      return;
    }

    const searchCode = selectedCode?.code || inputValue.trim();

    // Validar formato ORPHA (acepta ORPHA.XXXX o ORPHAXXXX)
    if (!/^ORPHA\.?\d+$/i.test(searchCode)) {
      setError('Formato inválido. Use: ORPHA.XXXX o ORPHAXXXX (ej: ORPHA.123)');
      return;
    }

    setError('');
    setLoading(true);
    setSearched(true);

    try {
      // Normalizar formato a ORPHA.XXXX
      const normalizedCode = searchCode.replace(/^ORPHA\.?(\d+)$/i, 'ORPHA.$1');

      const response = await api.get('/patients', {
        params: { diagnostico: normalizedCode }
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
      field: 'diagnosticosDetalle',
      headerName: 'Diagnósticos',
      flex: 1,
      minWidth: 400,
      renderCell: (params) => {
        const diagnosticos = params.value || params.row.diagnosticos?.map(code => ({
          codigo: code,
          nombre: code,
          esPlaceholder: code === 'PENDIENTE'
        })) || [];

        const searchCode = selectedCode?.code || inputValue.trim().replace(/^ORPHA\.?(\d+)$/i, 'ORPHA.$1');

        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, py: 1 }}>
            {diagnosticos.map((diag, index) => {
              const isPending = diag.esPlaceholder;
              const isSearched = diag.codigo === searchCode;
              const label = isPending ? diag.nombre : `${diag.codigo} - ${diag.nombre}`;

              return (
                <Tooltip key={index} title={`Código: ${diag.codigo}`} arrow>
                  <Chip
                    label={label}
                    size="small"
                    color={isSearched ? 'primary' : isPending ? 'warning' : 'default'}
                    variant={isSearched || !isPending ? 'filled' : 'outlined'}
                    icon={isPending ? <InfoIcon fontSize="small" /> : undefined}
                  />
                </Tooltip>
              );
            })}
          </Box>
        );
      }
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
            options={options}
            value={selectedCode}
            onChange={(event, newValue) => {
              setSelectedCode(newValue);
              if (newValue) {
                setInputValue(newValue.code);
              }
            }}
            inputValue={inputValue}
            onInputChange={handleInputChange}
            getOptionLabel={(option) => {
              if (typeof option === 'string') return option;
              return `${option.code} - ${option.nombre}`;
            }}
            loading={loadingOptions}
            disabled={loading}
            fullWidth
            filterOptions={(x) => x} // No filtrar en cliente, ya viene filtrado del servidor
            renderOption={(props, option) => (
              <li {...props} key={option.code}>
                <Box>
                  <Typography variant="body1" component="div">
                    {option.code}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {option.nombre}
                  </Typography>
                </Box>
              </li>
            )}
            renderInput={(params) => (
              <TextField
                {...params}
                label="Código ORPHA o Nombre de Enfermedad"
                placeholder="Escribe código (ORPHA.123) o nombre de enfermedad..."
                helperText="Escribe al menos 2 caracteres para buscar. Sólo se muestran códigos ya registrados en pacientes."
                InputProps={{
                  ...params.InputProps,
                  endAdornment: (
                    <>
                      {loadingOptions ? <CircularProgress color="inherit" size={20} /> : null}
                      {params.InputProps.endAdornment}
                    </>
                  ),
                }}
              />
            )}
            noOptionsText={inputValue.length < 2 ? "Escribe al menos 2 caracteres" : "No se encontraron códigos"}
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
                params={{ diagnostico: selectedCode?.code || inputValue.trim() }}
                type="patients"
                label="Exportar Resultados"
              />
            )}
          </Box>

          {patients.length === 0 ? (
            <Alert severity="info">
              No se encontraron pacientes con el diagnóstico {selectedCode?.code || inputValue.trim()}
            </Alert>
          ) : (
            <Box sx={{ height: 600 }}>
              <DataGrid
                rows={patients}
                columns={columns}
                getRowId={(row) => row.nhc}
                initialState={{
                  pagination: {
                    paginationModel: { pageSize: 10 }
                  }
                }}
                pageSizeOptions={[10, 25, 50]}
                disableSelectionOnClick
                rowHeight={80}
              />
            </Box>
          )}
        </Paper>
      )}
    </Box>
  );
}
