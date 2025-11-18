/**
 * User Management Component
 * Gestión de usuarios del sistema (Solo Admin)
 */

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Paper,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  TextField,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  Alert,
  CircularProgress,
  IconButton
} from '@mui/material';
import { People, Add, Delete, VpnKey } from '@mui/icons-material';
import { DataGrid } from '@mui/x-data-grid';
import { usersAPI } from '../../services/api';
import { useAuth } from '../../contexts/AuthContext';

export default function UserManagement() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [openCreate, setOpenCreate] = useState(false);
  const [openPassword, setOpenPassword] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);

  const [newUser, setNewUser] = useState({ username: '', password: '', rol: 'usuario' });
  const [newPassword, setNewPassword] = useState('');
  const [formError, setFormError] = useState('');

  const { user: currentUser } = useAuth();

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await usersAPI.getAll();
      setUsers(response.data.users || []);
    } catch (err) {
      setError('Error cargando usuarios');
    } finally {
      setLoading(false);
    }
  };

  const handleCreateUser = async () => {
    setFormError('');

    if (!newUser.username || !newUser.password) {
      setFormError('Todos los campos son requeridos');
      return;
    }

    try {
      await usersAPI.create(newUser);
      setOpenCreate(false);
      setNewUser({ username: '', password: '', rol: 'usuario' });
      fetchUsers();
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error creando usuario');
    }
  };

  const handleChangePassword = async () => {
    setFormError('');

    if (!newPassword) {
      setFormError('La contraseña es requerida');
      return;
    }

    try {
      await usersAPI.updatePassword(selectedUser.id, newPassword);
      setOpenPassword(false);
      setNewPassword('');
      setSelectedUser(null);
    } catch (err) {
      setFormError(err.response?.data?.error || 'Error cambiando contraseña');
    }
  };

  const handleDeleteUser = async (userId) => {
    if (!window.confirm('¿Está seguro de eliminar este usuario?')) {
      return;
    }

    try {
      await usersAPI.delete(userId);
      fetchUsers();
    } catch (err) {
      setError(err.response?.data?.error || 'Error eliminando usuario');
    }
  };

  const columns = [
    { field: 'id', headerName: 'ID', width: 80, headerAlign: 'center', align: 'center' },
    { field: 'username', headerName: 'Usuario', flex: 1, minWidth: 150 },
    {
      field: 'rol',
      headerName: 'Rol',
      width: 120,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (params) => params.value === 'admin' ? 'Administrador' : 'Usuario'
    },
    {
      field: 'created_at',
      headerName: 'Fecha Creación',
      width: 150,
      headerAlign: 'center',
      align: 'center',
      valueFormatter: (params) => new Date(params.value).toLocaleDateString('es-ES')
    },
    {
      field: 'actions',
      headerName: 'Acciones',
      width: 150,
      headerAlign: 'center',
      align: 'center',
      sortable: false,
      renderCell: (params) => (
        <Box>
          <IconButton
            size="small"
            color="primary"
            onClick={() => {
              setSelectedUser(params.row);
              setOpenPassword(true);
            }}
            title="Cambiar contraseña"
          >
            <VpnKey />
          </IconButton>
          <IconButton
            size="small"
            color="error"
            onClick={() => handleDeleteUser(params.row.id)}
            disabled={params.row.id === currentUser?.id}
            title="Eliminar usuario"
          >
            <Delete />
          </IconButton>
        </Box>
      )
    }
  ];

  return (
    <Box>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 3 }}>
        <Typography variant="h5">
          <People sx={{ verticalAlign: 'middle', mr: 1 }} />
          Gestión de Usuarios
        </Typography>

        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenCreate(true)}
        >
          Nuevo Usuario
        </Button>
      </Box>

      {error && <Alert severity="error" sx={{ mb: 3 }}>{error}</Alert>}

      <Paper sx={{ p: 3, height: 600 }}>
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 5 }}>
            <CircularProgress />
          </Box>
        ) : (
          <DataGrid
            rows={users}
            columns={columns}
            pageSize={10}
            rowsPerPageOptions={[10, 25, 50]}
            disableSelectionOnClick
          />
        )}
      </Paper>

      {/* Dialog Crear Usuario */}
      <Dialog open={openCreate} onClose={() => setOpenCreate(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Crear Nuevo Usuario</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}

          <TextField
            label="Nombre de Usuario"
            fullWidth
            margin="normal"
            value={newUser.username}
            onChange={(e) => setNewUser({ ...newUser, username: e.target.value })}
          />

          <TextField
            label="Contraseña"
            type="password"
            fullWidth
            margin="normal"
            value={newUser.password}
            onChange={(e) => setNewUser({ ...newUser, password: e.target.value })}
            helperText="Mínimo 8 caracteres, 1 mayúscula, 1 número"
          />

          <FormControl fullWidth margin="normal">
            <InputLabel>Rol</InputLabel>
            <Select
              value={newUser.rol}
              label="Rol"
              onChange={(e) => setNewUser({ ...newUser, rol: e.target.value })}
            >
              <MenuItem value="usuario">Usuario</MenuItem>
              <MenuItem value="admin">Administrador</MenuItem>
            </Select>
          </FormControl>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenCreate(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleCreateUser}>Crear</Button>
        </DialogActions>
      </Dialog>

      {/* Dialog Cambiar Contraseña */}
      <Dialog open={openPassword} onClose={() => setOpenPassword(false)} maxWidth="sm" fullWidth>
        <DialogTitle>Cambiar Contraseña - {selectedUser?.username}</DialogTitle>
        <DialogContent>
          {formError && <Alert severity="error" sx={{ mb: 2 }}>{formError}</Alert>}

          <TextField
            label="Nueva Contraseña"
            type="password"
            fullWidth
            margin="normal"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            helperText="Mínimo 8 caracteres, 1 mayúscula, 1 número"
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenPassword(false)}>Cancelar</Button>
          <Button variant="contained" onClick={handleChangePassword}>Cambiar</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
