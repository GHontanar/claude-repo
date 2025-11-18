/**
 * Statistics Dashboard Component
 * Panel de estadísticas del sistema
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Grid,
  Card,
  CardContent,
  CircularProgress,
  Alert
} from '@mui/material';
import { BarChart, People, LocalHospital, Warning } from '@mui/icons-material';
import { BarChart as RechartsBar, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { patientsAPI } from '../../services/api';
import ExportButton from '../Common/ExportButton';

export default function Dashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    fetchStats();
  }, []);

  const fetchStats = async () => {
    try {
      const response = await patientsAPI.getStats();
      setStats(response.data);
    } catch (err) {
      setError('Error cargando estadísticas');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
        <CircularProgress />
      </Box>
    );
  }

  if (error) {
    return <Alert severity="error">{error}</Alert>;
  }

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          <BarChart sx={{ verticalAlign: 'middle', mr: 1 }} />
          Estadísticas del Sistema
        </Typography>
        <ExportButton type="stats" label="Exportar Estadísticas" />
      </Box>

      <Grid container spacing={3} sx={{ mb: 4 }}>
        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <People color="primary" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Total de Pacientes
                  </Typography>
                  <Typography variant="h4">
                    {stats?.total_pacientes || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <LocalHospital color="success" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Diagnósticos Únicos
                  </Typography>
                  <Typography variant="h4">
                    {stats?.total_diagnosticos_unicos || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={4}>
          <Card>
            <CardContent>
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                <Warning color="warning" sx={{ fontSize: 40, mr: 2 }} />
                <Box>
                  <Typography variant="body2" color="text.secondary">
                    Sin Seguimiento (&gt;1 año)
                  </Typography>
                  <Typography variant="h4">
                    {stats?.pacientes_sin_seguimiento_reciente || 0}
                  </Typography>
                </Box>
              </Box>
            </CardContent>
          </Card>
        </Grid>
      </Grid>

      <Paper sx={{ p: 3 }}>
        <Typography variant="h6" gutterBottom>
          Top 10 Diagnósticos Más Frecuentes
        </Typography>

        {stats?.diagnosticos_frecuentes && stats.diagnosticos_frecuentes.length > 0 ? (
          <ResponsiveContainer width="100%" height={400}>
            <RechartsBar data={stats.diagnosticos_frecuentes}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="codigo" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="count" fill="#1976d2" name="Cantidad de Pacientes" />
            </RechartsBar>
          </ResponsiveContainer>
        ) : (
          <Alert severity="info">No hay datos de diagnósticos disponibles</Alert>
        )}
      </Paper>
    </Box>
  );
}
