// src/routes.js
import React, { useState, useEffect } from 'react';
import {
  Routes,
  Route,
  Navigate,
  useNavigate
} from 'react-router-dom';
import Login from './components/Login';
import Chofer from './components/Chofer';
import Fiscal from './components/Fiscal';
import Admin from './components/Admin';
import Pasajero from './components/Pasajero';
import RecuperarClave from './components/RecuperarClave';

// ─── Helpers de sesión ────────────────────────────────────────────────────────
function guardarSesion(usuario) {
  localStorage.setItem('usuarioLogueado', JSON.stringify(usuario));
}

function obtenerSesion() {
  try {
    return JSON.parse(localStorage.getItem('usuarioLogueado'));
  } catch {
    return null;
  }
}

function borrarSesion() {
  localStorage.removeItem('usuarioLogueado');
}

// ─── Ruta protegida por rol ───────────────────────────────────────────────────
function RutaProtegida({ rolRequerido, usuario, children }) {
  if (!usuario) return <Navigate to="/" replace />;
  if (rolRequerido && usuario.rol !== rolRequerido) return <Navigate to="/" replace />;
  return children;
}

// ─── Página Login ─────────────────────────────────────────────────────────────
function PaginaLogin({ onLogin }) {
  const navigate = useNavigate();

  const handleLogin = (usuarioDatos) => {
    guardarSesion(usuarioDatos);
    onLogin(usuarioDatos);
    navigate(`/${usuarioDatos.rol}`, { replace: true });
  };

  return (
    <Login
      onLogin={handleLogin}
      onRecuperar={() => navigate('/recuperar')}
    />
  );
}

// ─── Página Recuperar Clave ───────────────────────────────────────────────────
function PaginaRecuperar() {
  const navigate = useNavigate();
  return <RecuperarClave onVolver={() => navigate('/')} />;
}

// ─── Enrutador principal ──────────────────────────────────────────────────────
function AppRoutes() {
  const [usuario, setUsuario] = useState(() => obtenerSesion());

  useEffect(() => {
    if (usuario) guardarSesion(usuario);
  }, [usuario]);

  const handleLogin = (usuarioDatos) => setUsuario(usuarioDatos);

  const handleLogout = () => {
    borrarSesion();
    setUsuario(null);
  };

  const handleUpdateUsuario = (usuarioActualizado) => {
    setUsuario(usuarioActualizado);
    guardarSesion(usuarioActualizado);
  };

  return (
    <Routes>
      {/* Pública: Login */}
      <Route
        path="/"
        element={
          usuario
            ? <Navigate to={`/${usuario.rol}`} replace />
            : <PaginaLogin onLogin={handleLogin} />
        }
      />

      {/* Pública: Recuperar contraseña */}
      <Route path="/recuperar" element={<PaginaRecuperar />} />

      {/* Privada: Admin */}
      <Route
        path="/admin"
        element={
          <RutaProtegida rolRequerido="admin" usuario={usuario}>
            <Admin usuario={usuario} onUpdateUser={handleUpdateUsuario} onLogout={handleLogout} />
          </RutaProtegida>
        }
      />

      {/* Privada: Chofer */}
      <Route
        path="/chofer"
        element={
          <RutaProtegida rolRequerido="chofer" usuario={usuario}>
            <Chofer usuario={usuario} onUpdateUser={handleUpdateUsuario} onLogout={handleLogout} />
          </RutaProtegida>
        }
      />

      {/* Privada: Fiscal */}
      <Route
        path="/fiscal"
        element={
          <RutaProtegida rolRequerido="fiscal" usuario={usuario}>
            <Fiscal usuario={usuario} onUpdateUser={handleUpdateUsuario} onLogout={handleLogout} />
          </RutaProtegida>
        }
      />

      {/* Privada: Pasajero */}
      <Route
        path="/pasajero"
        element={
          <RutaProtegida rolRequerido="pasajero" usuario={usuario}>
            <Pasajero usuario={usuario} onUpdateUser={handleUpdateUsuario} onLogout={handleLogout} />
          </RutaProtegida>
        }
      />

      {/* Cualquier ruta desconocida → Login */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default AppRoutes;
