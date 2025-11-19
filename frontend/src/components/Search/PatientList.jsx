/**
 * Patient List Component
 * Listado completo de pacientes con paginación
 */

import { useState, useEffect } from 'react';
import {
  Paper,
  Box,
  Typography,
  Alert,
  CircularProgress,
  Chip,
  Tooltip
} from '@mui/material';
import { List as ListIcon, Info as InfoIcon } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { patientsAPI } from '../../services/api';
import ExportButton from '../Common/ExportButton';

export default function PatientList() {
  const [patients, setPatients] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [paginationModel, setPaginationModel] = useState({
    page: 0,
    pageSize: 25
  });

  useEffect(() => {
    fetchPatients();
  }, [paginationModel]);

  const fetchPatients = async () => {
    setLoading(true);
    setError('');

    try {
      const response = await patientsAPI.getAll({
        limit: paginationModel.pageSize,
        offset: paginationModel.page * paginationModel.pageSize
      });

      setPatients(response.data.patients || []);
      setTotal(response.data.pagination?.total || 0);
    } catch (err) {
      setError('Error cargando pacientes. Por favor intente de nuevo.');
      console.error('Error fetching patients:', err);
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

        return (
          <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5, py: 1 }}>
            {diagnosticos.map((diag, index) => {
              const isPending = diag.esPlaceholder;
              const label = isPending ? diag.nombre : `${diag.codigo} - ${diag.nombre}`;

              return (
                <Tooltip key={index} title={`Código: ${diag.codigo}`} arrow>
                  <Chip
                    label={label}
                    size="small"
                    color={isPending ? 'warning' : 'primary'}
                    variant={isPending ? 'outlined' : 'filled'}
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
        <ListIcon sx={{ verticalAlign: 'middle', mr: 1 }} />
        Listado Completo de Pacientes
      </Typography>

      {error && (
        <Alert severity="error" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

      <Paper sx={{ p: 3 }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
          <Typography variant="h6">
            Total: {total} paciente(s)
          </Typography>

          {total > 0 && (
            <ExportButton
              type="patients"
              label="Exportar Todos"
            />
          )}
        </Box>

        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        )}

        {!loading && patients.length === 0 ? (
          <Alert severity="info">
            No hay pacientes registrados en el sistema
          </Alert>
        ) : (
          !loading && (
            <Box sx={{ height: 600 }}>
              <DataGrid
                rows={patients}
                columns={columns}
                getRowId={(row) => row.nhc}
                paginationModel={paginationModel}
                onPaginationModelChange={setPaginationModel}
                pageSizeOptions={[10, 25, 50, 100]}
                paginationMode="server"
                rowCount={total}
                disableSelectionOnClick
                rowHeight={60}
                loading={loading}
              />
            </Box>
          )
        )}
      </Paper>
    </Box>
  );
}
