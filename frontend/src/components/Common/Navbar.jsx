/**
 * Navbar Component
 * Barra de navegación principal
 */

import { useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  AppBar,
  Toolbar,
  Typography,
  Button,
  Box,
  IconButton,
  Menu,
  MenuItem,
  Divider
} from '@mui/material';
import {
  AccountCircle,
  ExitToApp,
  Dashboard as DashboardIcon,
  Upload,
  People,
  BarChart
} from '@mui/icons-material';
import { useAuth } from '../../contexts/AuthContext';

export default function Navbar() {
  const { user, logout, isAdmin } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [anchorEl, setAnchorEl] = useState(null);

  const handleMenu = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const handleLogout = () => {
    handleClose();
    logout();
    navigate('/login');
  };

  const handleNavigate = (path) => {
    navigate(path);
  };

  const isActive = (path) => {
    return location.pathname === path;
  };

  return (
    <AppBar position="static">
      <Toolbar>
        <Typography variant="h6" component="div" sx={{ flexGrow: 0, mr: 4 }}>
          Base de datos de pacientes de Hematología
        </Typography>

        <Box sx={{ flexGrow: 1, display: 'flex', gap: 1 }}>
          <Button
            color="inherit"
            startIcon={<DashboardIcon />}
            onClick={() => handleNavigate('/dashboard')}
            sx={{
              bgcolor: isActive('/dashboard') ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            Búsquedas
          </Button>

          <Button
            color="inherit"
            startIcon={<BarChart />}
            onClick={() => handleNavigate('/stats')}
            sx={{
              bgcolor: isActive('/stats') ? 'rgba(255,255,255,0.1)' : 'transparent'
            }}
          >
            Estadísticas
          </Button>

          {isAdmin() && (
            <>
              <Button
                color="inherit"
                startIcon={<Upload />}
                onClick={() => handleNavigate('/admin/import')}
                sx={{
                  bgcolor: isActive('/admin/import') ? 'rgba(255,255,255,0.1)' : 'transparent'
                }}
              >
                Importar
              </Button>

              <Button
                color="inherit"
                startIcon={<People />}
                onClick={() => handleNavigate('/admin/users')}
                sx={{
                  bgcolor: isActive('/admin/users') ? 'rgba(255,255,255,0.1)' : 'transparent'
                }}
              >
                Usuarios
              </Button>
            </>
          )}
        </Box>

        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <Typography variant="body2">
            {user?.username} ({user?.rol})
          </Typography>

          <IconButton
            size="large"
            onClick={handleMenu}
            color="inherit"
          >
            <AccountCircle />
          </IconButton>

          <Menu
            anchorEl={anchorEl}
            open={Boolean(anchorEl)}
            onClose={handleClose}
            anchorOrigin={{
              vertical: 'bottom',
              horizontal: 'right'
            }}
            transformOrigin={{
              vertical: 'top',
              horizontal: 'right'
            }}
          >
            <MenuItem disabled>
              <Typography variant="body2">
                {user?.username}
              </Typography>
            </MenuItem>

            <MenuItem disabled>
              <Typography variant="caption" color="text.secondary">
                Rol: {user?.rol}
              </Typography>
            </MenuItem>

            <Divider />

            <MenuItem onClick={handleLogout}>
              <ExitToApp sx={{ mr: 1 }} fontSize="small" />
              Cerrar Sesión
            </MenuItem>
          </Menu>
        </Box>
      </Toolbar>
    </AppBar>
  );
}
