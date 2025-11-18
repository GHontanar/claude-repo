/**
 * App Component
 * Componente principal con routing
 */

import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { ThemeProvider, createTheme, CssBaseline, Container, Box, Tabs, Tab } from '@mui/material';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Login from './components/Auth/Login';
import ProtectedRoute from './components/Auth/ProtectedRoute';
import Navbar from './components/Common/Navbar';
import SearchByNHC from './components/Search/SearchByNHC';
import SearchByDiagnosis from './components/Search/SearchByDiagnosis';
import PatientList from './components/Search/PatientList';
import Dashboard from './components/Stats/Dashboard';
import ImportData from './components/Admin/ImportData';
import UserManagement from './components/Admin/UserManagement';
import { useState } from 'react';

// Tema personalizado
const theme = createTheme({
  palette: {
    primary: {
      main: '#1976d2'
    },
    secondary: {
      main: '#dc004e'
    }
  }
});

// Dashboard de búsquedas con tabs
function SearchDashboard() {
  const [currentTab, setCurrentTab] = useState(0);

  return (
    <Box>
      <Tabs
        value={currentTab}
        onChange={(e, newValue) => setCurrentTab(newValue)}
        sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}
      >
        <Tab label="Buscar por NHC" />
        <Tab label="Buscar por Diagnóstico" />
        <Tab label="Listado Completo" />
      </Tabs>

      {currentTab === 0 && <SearchByNHC />}
      {currentTab === 1 && <SearchByDiagnosis />}
      {currentTab === 2 && <PatientList />}
    </Box>
  );
}

// Layout principal con Navbar
function MainLayout({ children }) {
  const { user } = useAuth();

  if (!user) return children;

  return (
    <>
      <Navbar />
      <Container maxWidth="xl" sx={{ mt: 4, mb: 4 }}>
        {children}
      </Container>
    </>
  );
}

function AppRoutes() {
  return (
    <Routes>
      {/* Login */}
      <Route path="/login" element={<Login />} />

      {/* Dashboard de búsquedas (usuarios y admins) */}
      <Route
        path="/dashboard"
        element={
          <ProtectedRoute>
            <SearchDashboard />
          </ProtectedRoute>
        }
      />

      {/* Estadísticas (usuarios y admins) */}
      <Route
        path="/stats"
        element={
          <ProtectedRoute>
            <Dashboard />
          </ProtectedRoute>
        }
      />

      {/* Importar datos (solo admin) */}
      <Route
        path="/admin/import"
        element={
          <ProtectedRoute requireAdmin>
            <ImportData />
          </ProtectedRoute>
        }
      />

      {/* Gestión de usuarios (solo admin) */}
      <Route
        path="/admin/users"
        element={
          <ProtectedRoute requireAdmin>
            <UserManagement />
          </ProtectedRoute>
        }
      />

      {/* Redirect por defecto */}
      <Route path="/" element={<Navigate to="/dashboard" replace />} />
      <Route path="*" element={<Navigate to="/dashboard" replace />} />
    </Routes>
  );
}

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <AuthProvider>
        <BrowserRouter>
          <MainLayout>
            <AppRoutes />
          </MainLayout>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

export default App;
