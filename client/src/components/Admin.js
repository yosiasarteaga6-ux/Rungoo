import React, { useState, useEffect, useRef } from 'react';
import ThemeToggle from './ThemeToggle';
import Clock from './Clock';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import { Home, UserPlus, Users, Bus, AlertTriangle, MapPin, BarChart2, Shield } from 'lucide-react';
import API_BASE_URL from '../config';

// Componente Custom Dropdown Buscable de Selección
function SearchableSelector({ options, value, onChange, placeholder, label }) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isOpen, setIsOpen] = useState(false);
  const containerRef = useRef(null);

  useEffect(() => {
    function handleClickOutside(event) {
      if (containerRef.current && !containerRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const filteredOptions = options.filter(opt => {
    const term = searchTerm.toLowerCase();
    const val = typeof opt === 'string' ? opt : (opt.name || opt.label || '');
    return val.toLowerCase().includes(term);
  });

  const getDisplayValue = () => {
    if (value !== undefined && value !== null) {
      const found = options.find(opt => {
        const valId = typeof opt === 'string' ? opt : opt.id;
        return String(valId) === String(value);
      });
      if (found) {
        return typeof found === 'string' ? found : found.name;
      }
    }
    return '';
  };

  return (
    <div className="searchable-select-container" ref={containerRef}>
      {label && <label>{label}</label>}
      <div className="searchable-select-input-wrapper" onClick={() => setIsOpen(!isOpen)}>
        <input
          type="text"
          placeholder={placeholder || "Escribe para buscar..."}
          value={isOpen ? searchTerm : getDisplayValue()}
          onChange={(e) => {
            setSearchTerm(e.target.value);
            setIsOpen(true);
          }}
          onFocus={() => {
            setIsOpen(true);
            setSearchTerm('');
          }}
          className="searchable-select-input"
        />
        <span className="searchable-select-arrow">{isOpen ? '▲' : '▼'}</span>
      </div>

      {isOpen && (
        <div className="searchable-select-dropdown">
          {filteredOptions.length === 0 ? (
            <div className="searchable-select-no-results">Sin resultados</div>
          ) : (
            filteredOptions.map((opt, index) => {
              const optId = typeof opt === 'string' ? opt : opt.id;
              const optDisplay = typeof opt === 'string' ? opt : opt.name;
              return (
                <div
                  key={index}
                  className={`searchable-select-option ${String(optId) === String(value) ? 'selected' : ''}`}
                  onClick={(e) => {
                    e.stopPropagation();
                    onChange(optId);
                    setSearchTerm('');
                    setIsOpen(false);
                  }}
                >
                  {optDisplay}
                </div>
              );
            })
          )}
        </div>
      )}
    </div>
  );
}

// Algoritmo de cálculo de vueltas completas en orden secuencial por unidad
function calcularVueltasPorUnidad(llegadasUnidad) {
  const ordenadas = [...llegadasUnidad].sort((a, b) => a.horaLlegada.localeCompare(b.horaLlegada));

  let vueltasCompletas = 0;
  let vueltaActual = { calderas: null, sanAntonio: null, falcon: null };
  const detallesVueltas = [];

  for (const ll of ordenadas) {
    const paradaNorm = ll.parada.toUpperCase().trim();
    if (paradaNorm === 'CALDERAS') {
      if (!vueltaActual.sanAntonio) {
        vueltaActual.calderas = ll.horaLlegada;
      } else {
        vueltaActual = { calderas: ll.horaLlegada, sanAntonio: null, falcon: null };
      }
    } else if (paradaNorm === 'SAN ANTONIO') {
      if (vueltaActual.calderas && !vueltaActual.falcon) {
        vueltaActual.sanAntonio = ll.horaLlegada;
      }
    } else if (paradaNorm === 'JUAN CRISOSTOMO FALCON' || paradaNorm.includes('FALCON')) {
      if (vueltaActual.calderas && vueltaActual.sanAntonio) {
        vueltaActual.falcon = ll.horaLlegada;
        vueltasCompletas++;

        const [hA, mA] = vueltaActual.calderas.split(':').map(Number);
        const [hB, mB] = vueltaActual.falcon.split(':').map(Number);
        const diff = (hB * 60 + mB) - (hA * 60 + mA);

        detallesVueltas.push({
          numero: vueltasCompletas,
          inicio: vueltaActual.calderas,
          medio: vueltaActual.sanAntonio,
          fin: vueltaActual.falcon,
          duracion: diff > 0 ? `${diff} min` : 'N/A'
        });

        vueltaActual = { calderas: null, sanAntonio: null, falcon: null };
      }
    }
  }
  return { count: vueltasCompletas, detalles: detallesVueltas };
}

function Admin({ usuario, onLogout, onUpdateUser }) {
  const [tab, setTab] = useState('home'); // home | registro | usuarios | incidencias | unidades | paradas | reporte | seguridad
  const [generandoPDF, setGenerandoPDF] = useState(false);
  const [menuAbierto, setMenuAbierto] = useState(false);

  // ── Dashboard Home Stats ──
  const [homeStats, setHomeStats] = useState({
    unidadesActivas: 0,
    unidadesTotal: 0,
    personalTurno: 0,
    personalTotal: 0,
    incidenciasPendientes: 0,
    incidenciasNombres: [],
  });
  const [actividadReciente, setActividadReciente] = useState([]);
  const [loadingHome, setLoadingHome] = useState(false);

  // Estados para Registro de Personal
  const [nombre, setNombre] = useState('');
  const [rol, setRol] = useState('chofer');
  const [usuarioForm, setUsuarioForm] = useState('');
  const [clave, setClave] = useState('');
  const [correo, setCorreo] = useState('');
  const [telefono, setTelefono] = useState('');

  // Estados para Registro de Unidades
  const [nombreUnidad, setNombreUnidad] = useState('');
  const [modelo, setModelo] = useState('');
  const [placa, setPlaca] = useState('');
  const [estadoUnidad, setEstadoUnidad] = useState('Operativa');
  const [choferAsig, setChoferAsig] = useState('');

  // Estados para listas guardadas
  const [listaUsuarios, setListaUsuarios] = useState([]);
  const [listaIncidencias, setListaIncidencias] = useState([]);
  const [listaUnidades, setListaUnidades] = useState([]);
  const [listaLlegadas, setListaLlegadas] = useState([]);

  // Búsqueda en expedientes
  const [searchTerm, setSearchTerm] = useState('');

  // Selector de Paradas
  const [paradaAdminSeleccionada, setParadaAdminSeleccionada] = useState(null);

  // Estados para filtro de usuarios y selección
  const [filtroRol, setFiltroRol] = useState('chofer');
  const [usuarioSeleccionado, setUsuarioSeleccionado] = useState(null);

  // Estados para gestión de unidades redesign
  const [searchUnidad, setSearchUnidad] = useState('');
  const [mostrarFormUnidad, setMostrarFormUnidad] = useState(false);

  // Estados para incidencias
  const [searchIncidencia, setSearchIncidencia] = useState('');
  const [filtroIncidencia, setFiltroIncidencia] = useState('Todas');

  // Estados Edición Llegadas (Admin no necesita pin)
  const [editandoId, setEditandoId] = useState(null);
  const [paradaEdit, setParadaEdit] = useState('');
  const [horaEdit, setHoraEdit] = useState('');

  // Estados para Seguridad
  const [editandoSeguridad, setEditandoSeguridad] = useState(false);
  const [preguntaTmp, setPreguntaTmp] = useState(usuario.preguntaSeguridad || '¿Cuál es el nombre de tu primera mascota?');
  const [respuestaTmp, setRespuestaTmp] = useState('');
  const [guardandoSeg, setGuardandoSeg] = useState(false);

  // Refrescar datos al cambiar de pestaña
  useEffect(() => {
    if (tab === 'home') {
      fetchHomeStats();
    }
    if (tab === 'usuarios' || tab === 'unidades') {
      fetch(`${API_BASE_URL}/api/usuarios`)
        .then(res => res.json())
        .then(data => setListaUsuarios(data))
        .catch(err => console.error(err));
    }
    if (tab === 'unidades') {
      fetch(`${API_BASE_URL}/api/unidades`)
        .then(res => res.json())
        .then(data => setListaUnidades(data))
        .catch(err => console.error(err));
    }
    if (tab === 'incidencias') {
      fetch(`${API_BASE_URL}/api/incidencias`)
        .then(res => res.json())
        .then(data => setListaIncidencias(data))
        .catch(err => console.error(err));
    }
    if (tab === 'paradas' || tab === 'reporte') {
      fetchLlegadas();
    }
  }, [tab]);

  const fetchHomeStats = async () => {
    setLoadingHome(true);
    try {
      const [resU, resUsr, resInc, resLl] = await Promise.all([
        fetch(`${API_BASE_URL}/api/unidades`).catch(() => null),
        fetch(`${API_BASE_URL}/api/usuarios`).catch(() => null),
        fetch(`${API_BASE_URL}/api/incidencias`).catch(() => null),
        fetch(`${API_BASE_URL}/api/llegadas`).catch(() => null),
      ]);

      const unidades = resU ? await resU.json() : [];
      const usuarios = resUsr ? await resUsr.json() : [];
      const incidencias = resInc ? await resInc.json() : [];
      const llegadas = resLl ? await resLl.json() : [];

      const unidadesActivas = unidades.filter(u => u.estado === 'Operativa').length;
      const personalConRol = usuarios.filter(u => u.rol === 'chofer' || u.rol === 'fiscal');
      // Personal "en turno" = los que tienen unidad asignada o llegada hoy
      const hoy = new Date().toDateString();
      const unidadesEnRuta = new Set(
        llegadas
          .filter(ll => {
            if (!ll.createdAt && !ll.fecha) return true;
            const d = new Date(ll.createdAt || ll.fecha);
            return d.toDateString() === hoy;
          })
          .map(ll => ll.nombreUnidad)
      );
      const personalTurno = unidades.filter(u => u.choferAsignado && unidadesEnRuta.has(u.nombre)).length || Math.min(unidadesActivas, personalConRol.length);

      const incsPendientes = incidencias.filter(i => !i.resuelta && !i.cerrada);

      // Actividad reciente: mezcla de llegadas + incidencias, ordenadas por hora
      const eventos = [
        ...llegadas.slice(-20).map(ll => ({
          hora: ll.horaLlegada || '--:--',
          texto: `Unidad ${ll.nombreUnidad || '?'} inició ruta "${ll.parada || 'desconocida'}"`,
          tipo: 'ruta',
          ts: ll.createdAt || ll.fecha || ''
        })),
        ...incidencias.slice(-10).map(inc => ({
          hora: inc.createdAt ? new Date(inc.createdAt).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' }) : '--:--',
          texto: `Incidencia #${inc._id ? inc._id.slice(-2) : '?'} reportada (${inc.autor || 'desconocido'})`,
          tipo: 'incidencia',
          ts: inc.createdAt || ''
        }))
      ]
        .sort((a, b) => (b.ts > a.ts ? 1 : -1))
        .slice(0, 8);

      setHomeStats({
        unidadesActivas,
        unidadesTotal: unidades.length,
        personalTurno,
        personalTotal: personalConRol.length,
        incidenciasPendientes: incsPendientes.length,
        incidenciasNombres: incsPendientes.slice(0, 3).map((i, idx) => `#${idx + 23} ${i.descripcion ? i.descripcion.slice(0, 18) : 'Novedad'}...`),
      });
      setActividadReciente(eventos);
    } catch (err) {
      console.error('Error cargando stats home:', err);
    }
    setLoadingHome(false);
  };

  const fetchLlegadas = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/llegadas`);
      const data = await res.json();
      setListaLlegadas(data);
    } catch (err) { console.error(err); }
  };

  const handleModificarLlegada = async (e) => {
    e.preventDefault();
    try {
      const updateReq = await fetch(`${API_BASE_URL}/api/llegadas/${editandoId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ parada: paradaEdit, horaLlegada: horaEdit })
      });
      if (updateReq.ok) {
        alert("Modificación guardada exitosamente.");
        setEditandoId(null);
        fetchLlegadas();
      } else {
        alert("Problema actualizando la llegada.");
      }
    } catch (err) {
      alert("Error de conexión al guardar.");
    }
  };

  const abrirEdicion = (llegadaObj) => {
    setEditandoId(llegadaObj._id);
    setParadaEdit(llegadaObj.parada);
    setHoraEdit(llegadaObj.horaLlegada);
  };

  const handleGuardarSeguridad = async (e) => {
    e.preventDefault();
    if (!respuestaTmp) {
      alert("Debes escribir una respuesta.");
      return;
    }
    setGuardandoSeg(true);
    try {
      const resp = await fetch(`${API_BASE_URL}/api/usuarios/${usuario._id}/seguridad`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ preguntaSeguridad: preguntaTmp, respuestaSeguridad: respuestaTmp })
      });
      if (resp.ok) {
        alert("Seguridad actualizada correctamente.");
        onUpdateUser({ ...usuario, preguntaSeguridad: preguntaTmp });
        setEditandoSeguridad(false);
        setRespuestaTmp('');
      } else {
        alert("Error al actualizar la seguridad.");
      }
    } catch (err) {
      alert("Error de conexión.");
    }
    setGuardandoSeg(false);
  };

  // Manejador Registro Persona
  const handleRegistro = async (e) => {
    e.preventDefault();
    try {
      const respuesta = await fetch(`${API_BASE_URL}/api/usuarios`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ nombre, rol, usuario: usuarioForm, clave, correo, telefono })
      });
      if (respuesta.ok) {
        alert(`¡Éxito! ${nombre} ha sido registrado.`);
        setNombre(''); setUsuarioForm(''); setClave(''); setCorreo(''); setTelefono('');
      } else {
        alert("Error al guardar usuario en el servidor.");
      }
    } catch (error) {
      alert("No se pudo conectar con el servidor.");
    }
  };

  // Manejador Registro Unidad
  const handleRegistroUnidad = async (e) => {
    e.preventDefault();
    try {
      const respuesta = await fetch(`${API_BASE_URL}/api/unidades`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          nombre: nombreUnidad,
          modelo,
          placa,
          estado: estadoUnidad,
          choferAsignado: choferAsig
        })
      });
      if (respuesta.ok) {
        alert(`¡Éxito! Unidad ${nombreUnidad} registrada.`);
        setNombreUnidad(''); setModelo(''); setPlaca('');
        setEstadoUnidad('Operativa'); setChoferAsig('');
        // Recargar lista
        const reqDb = await fetch(`${API_BASE_URL}/api/unidades`);
        const dbData = await reqDb.json();
        setListaUnidades(dbData);
      } else {
        alert("Error al guardar la unidad en el servidor.");
      }
    } catch (error) {
      alert("No se pudo conectar con el servidor.");
    }
  };

  const getSidebarClass = (current) => tab === current ? 'sidebar-btn active' : 'sidebar-btn';
  const cerrarMenu = () => setMenuAbierto(false);

  // Filtrar todos los que son chofer
  const choferesArray = listaUsuarios.filter(u => u.rol === 'chofer');

  // Filtrado general de expedientes
  const usuariosFiltrados = listaUsuarios.filter(u => {
    const rolActual = (u.rol || '').toLowerCase();
    if (filtroRol === 'chofer' && rolActual !== 'chofer') return false;
    if (filtroRol === 'fiscal' && rolActual !== 'fiscal') return false;
    if (filtroRol === 'admin' && (rolActual !== 'admin' && rolActual !== 'administrador')) return false;

    if (!searchTerm) return true;
    const term = searchTerm.toLowerCase();
    return (
      (u.nombre && u.nombre.toLowerCase().includes(term)) ||
      (u.apellido && u.apellido.toLowerCase().includes(term)) ||
      (u.cedula && u.cedula.toLowerCase().includes(term)) ||
      (u.telefono && u.telefono.toLowerCase().includes(term)) ||
      (u.correo && u.correo.toLowerCase().includes(term)) ||
      (u.usuario && u.usuario.toLowerCase().includes(term)) ||
      (u.rol && u.rol.toLowerCase().includes(term))
    );
  });

  // Cálculos y filtrado para Unidades
  const totalUnidades = listaUnidades.length;
  const operativas = listaUnidades.filter(u => u.estado === 'Operativa').length;
  const enTaller = listaUnidades.filter(u => u.estado === 'Mantenimiento' || u.estado === 'En taller').length;
  const inactivas = listaUnidades.filter(u => u.estado === 'Inhabilitada' || u.estado === 'Inactiva').length;

  const totalChoferes = choferesArray.length;
  const choferesAsignadosNombres = new Set(listaUnidades.map(u => u.choferAsignado).filter(Boolean));
  const asignados = choferesAsignadosNombres.size;
  const libres = totalChoferes - asignados;

  const unidadesFiltradas = listaUnidades.filter(u => {
    if (!searchUnidad) return true;
    const term = searchUnidad.toLowerCase();
    return (
      (u.nombre && u.nombre.toLowerCase().includes(term)) ||
      (u.modelo && u.modelo.toLowerCase().includes(term)) ||
      (u.placa && u.placa.toLowerCase().includes(term)) ||
      (u.choferAsignado && u.choferAsignado.toLowerCase().includes(term)) ||
      (u.estado && u.estado.toLowerCase().includes(term))
    );
  });

  // Cálculos para Incidencias
  const incidenciasFiltradas = listaIncidencias.filter(inc => {
    if (!searchIncidencia) return true;
    const term = searchIncidencia.toLowerCase();
    return (
      (inc.descripcion && inc.descripcion.toLowerCase().includes(term)) ||
      (inc.autor && inc.autor.toLowerCase().includes(term)) ||
      (inc.rol && inc.rol.toLowerCase().includes(term))
    );
  });

  const criticasCount = incidenciasFiltradas.filter(inc => inc.severidad === 'Crítica').length;
  const moderadasCount = incidenciasFiltradas.filter(inc => inc.severidad === 'Moderada' || !inc.severidad).length;

  return (
    <div className="dashboard-container">
      <button className="hamburger-btn" onClick={() => setMenuAbierto(!menuAbierto)} aria-label="Menú">
        <span className="hamburger-bar"></span>
        <span className="hamburger-bar"></span>
        <span className="hamburger-bar"></span>
      </button>
      {menuAbierto && <div className="sidebar-overlay visible" onClick={cerrarMenu} />}
      {/* MENÚ LATERAL */}
      <aside className={`sidebar${menuAbierto ? ' sidebar-open' : ''}`}>
        <div className="sidebar-profile">
          <img src="/logo.png" alt="Ruta Express Logo" style={{ width: '80px', height: 'auto', marginBottom: '10px', filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.4))' }} onError={(e) => e.target.style.display = 'none'} />
          <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #f39c12, #e67e22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', margin: '0 auto 10px' }}>
            {(usuario.nombre || 'A').charAt(0).toUpperCase()}
          </div>
          <h3 style={{ color: 'var(--text-main)', margin: '0 0 2px 0', fontSize: '1rem', fontWeight: 700 }}>{usuario.nombre || 'Administrador'}</h3>
          <p style={{ color: '#f39c12', margin: '0 0 6px 0', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Control Central</p>
          <span style={{ background: 'rgba(243,156,18,0.15)', color: '#f39c12', fontSize: '0.72rem', padding: '2px 10px', borderRadius: '20px', border: '1px solid rgba(243,156,18,0.3)' }}>● Admin</span>
        </div>

        <Clock />

        <nav className="sidebar-menu">
          <button className={getSidebarClass('home')} onClick={() => { setTab('home'); cerrarMenu(); }}>
            <Home size={18} /> Inicio
          </button>
          <button className={getSidebarClass('registro')} onClick={() => { setTab('registro'); cerrarMenu(); }}>
            <UserPlus size={18} /> Registrar Personal
          </button>
          <button className={getSidebarClass('usuarios')} onClick={() => { setTab('usuarios'); cerrarMenu(); }}>
            <Users size={18} /> Expedientes / Personal
          </button>
          <button className={getSidebarClass('unidades')} onClick={() => { setTab('unidades'); cerrarMenu(); }}>
            <Bus size={18} /> Gestión de Unidades
          </button>
          <button className={getSidebarClass('incidencias')} onClick={() => { setTab('incidencias'); cerrarMenu(); }}>
            <AlertTriangle size={18} /> Incidencias
          </button>
          <button className={getSidebarClass('paradas')} onClick={() => { setTab('paradas'); setParadaAdminSeleccionada(null); cerrarMenu(); }}>
            <MapPin size={18} /> Paradas
          </button>
          <button className={getSidebarClass('reporte')} onClick={() => { setTab('reporte'); cerrarMenu(); }}>
            <BarChart2 size={18} /> Reporte del Día
          </button>
          <button className={getSidebarClass('seguridad')} onClick={() => { setTab('seguridad'); cerrarMenu(); }}>
            <Shield size={18} /> Seguridad
          </button>
        </nav>

        <ThemeToggle style={{ width: "100%", marginBottom: "10px", justifyContent: "center" }} />
        <button onClick={onLogout} className="btn-logout">
          🚪 Cerrar Sesión
        </button>
      </aside>

      {/* NAVEGACIÓN INFERIOR (MÓVIL) */}
      <nav className="bottom-nav">
        <button className={`bottom-nav-item ${tab === 'home' ? 'active' : ''}`} onClick={() => setTab('home')}>
          <Home className="nav-icon" size={24} />
          <span>Inicio</span>
        </button>
        <button className={`bottom-nav-item ${tab === 'usuarios' ? 'active' : ''}`} onClick={() => setTab('usuarios')}>
          <Users className="nav-icon" size={24} />
          <span>Personal</span>
        </button>
        <button className={`bottom-nav-item ${tab === 'unidades' ? 'active' : ''}`} onClick={() => setTab('unidades')}>
          <Bus className="nav-icon" size={24} />
          <span>Unidades</span>
        </button>
        <button className={`bottom-nav-item ${tab === 'incidencias' ? 'active' : ''}`} onClick={() => setTab('incidencias')}>
          <AlertTriangle className="nav-icon" size={24} />
          <span>Reportes</span>
        </button>
        <button className={`bottom-nav-item ${tab === 'reporte' ? 'active' : ''}`} onClick={() => setTab('reporte')}>
          <BarChart2 className="nav-icon" size={24} />
          <span>Reporte</span>
        </button>
      </nav>

      {/* CONTENIDO PRINCIPAL */}
      <main className="main-content">
        {tab !== 'home' && (
          <div style={{ marginBottom: '20px' }}>
            <button onClick={() => setTab('home')} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '1rem', padding: '5px' }}>
              <span style={{ fontSize: '1.2rem' }}>⬅</span> Regresar
            </button>
          </div>
        )}

        {/* ── PANEL DE INICIO ── */}
        {tab === 'home' && (
          <div className="fade-in-tab">

            {/* ── Encabezado de bienvenida ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--neon-header-bg)', border: `1px solid var(--neon-header-border)`, borderRadius: '16px', padding: '24px 30px', marginBottom: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
              <h1 style={{ margin: 0, fontSize: '1.8rem', color: 'var(--text-main)', letterSpacing: '0.5px' }}>
                <span style={{ fontWeight: 400 }}>HOLA, </span><span style={{ fontWeight: 800 }}>ADMINISTRADOR PRINCIPAL</span>
              </h1>
              <button
                onClick={fetchHomeStats}
                disabled={loadingHome}
                style={{
                  background: 'var(--neon-icon-bg)', border: 'none',
                  color: 'var(--neon-icon-color)', borderRadius: '10px', padding: '10px 18px',
                  cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(0,0,0,0.1)'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(0,0,0,0.15)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(0,0,0,0.1)'; }}
              >
                {loadingHome ? '⏳' : '🔄'} Actualizar
              </button>
            </div>

            {/* ── Sección: Tablero de Control ── */}
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2.5px', margin: '0 0 14px 4px' }}>Tablero de Control de Ruta</p>

            {/* ── Tarjetas de KPIs ── */}
            <div style={{ position: 'relative', marginBottom: '36px' }}>
              
              {/* Background Glow Blobs */}
              <div style={{ position: 'absolute', top: '-20%', left: '5%', width: '40%', height: '140%', background: 'var(--neon-blob1)', filter: 'blur(60px)', zIndex: 0, borderRadius: '50%', pointerEvents: 'none', transition: 'background 0.3s' }} />
              <div style={{ position: 'absolute', top: '-10%', right: '5%', width: '35%', height: '120%', background: 'var(--neon-blob2)', filter: 'blur(60px)', zIndex: 0, borderRadius: '50%', pointerEvents: 'none', transition: 'background 0.3s' }} />
              <div style={{ position: 'absolute', top: '10%', left: '35%', width: '30%', height: '100%', background: 'var(--neon-blob3)', filter: 'blur(60px)', zIndex: 0, borderRadius: '50%', pointerEvents: 'none', transition: 'background 0.3s' }} />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', position: 'relative', zIndex: 1 }}>

                {/* Tarjeta 1: Unidades Activas */}
                <div
                  onClick={() => setTab('unidades')}
                  style={{
                    background: 'var(--neon-card-bg)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid var(--neon-card1-border)',
                    borderRadius: '16px', padding: '24px',
                    cursor: 'pointer', position: 'relative', overflow: 'hidden',
                    boxShadow: 'var(--neon-shadow)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15), var(--neon-shadow)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--neon-shadow)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <p style={{ color: 'var(--text-main)', margin: '0', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.5px' }}>UNIDADES ACTIVAS</p>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--neon-icon1-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s' }}>
                      <Bus size={20} color="var(--neon-icon1-color)" />
                    </div>
                  </div>
                  <div style={{ color: 'var(--neon-text-num)', fontSize: '2.8rem', fontWeight: 800, lineHeight: 1, display: 'flex', alignItems: 'baseline', gap: '8px', transition: 'color 0.3s' }}>
                    {loadingHome ? '–' : homeStats.unidadesActivas} 
                    <span style={{ fontSize: '1.4rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ {homeStats.unidadesTotal}</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', margin: '14px 0 0 0', fontSize: '0.8rem' }}>Operativas en la ruta</p>
                  
                  {/* Barra de progreso */}
                  <div style={{ marginTop: '16px', height: '4px', background: 'var(--neon-progress-track)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${homeStats.unidadesTotal > 0 ? (homeStats.unidadesActivas / homeStats.unidadesTotal) * 100 : 0}%`, background: 'var(--neon-icon1-color)', borderRadius: '2px', boxShadow: '0 0 10px var(--neon-icon1-color)', transition: 'width 0.8s ease, background 0.3s' }} />
                  </div>
                </div>

                {/* Tarjeta 2: Personal en Turno */}
                <div
                  onClick={() => setTab('usuarios')}
                  style={{
                    background: 'var(--neon-card-bg)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid var(--neon-card2-border)',
                    borderRadius: '16px', padding: '24px',
                    cursor: 'pointer', position: 'relative', overflow: 'hidden',
                    boxShadow: 'var(--neon-shadow)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15), var(--neon-shadow)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--neon-shadow)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <p style={{ color: 'var(--text-main)', margin: '0', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.5px' }}>PERSONAL EN TURNO</p>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--neon-icon2-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s' }}>
                      <Users size={20} color="var(--neon-icon2-color)" />
                    </div>
                  </div>
                  <div style={{ color: 'var(--neon-text-num)', fontSize: '2.8rem', fontWeight: 800, lineHeight: 1, display: 'flex', alignItems: 'baseline', gap: '8px', transition: 'color 0.3s' }}>
                    {loadingHome ? '–' : homeStats.personalTurno} 
                    <span style={{ fontSize: '1.4rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ {homeStats.personalTotal}</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', margin: '14px 0 0 0', fontSize: '0.8rem' }}>Choferes y fiscales activos</p>
                  
                  {/* Barra de progreso */}
                  <div style={{ marginTop: '16px', height: '4px', background: 'var(--neon-progress-track)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${homeStats.personalTotal > 0 ? (homeStats.personalTurno / homeStats.personalTotal) * 100 : 0}%`, background: 'var(--neon-icon2-color)', borderRadius: '2px', boxShadow: '0 0 10px var(--neon-icon2-color)', transition: 'width 0.8s ease, background 0.3s' }} />
                  </div>
                </div>

                {/* Tarjeta 3: Incidencias Activas */}
                <div
                  onClick={() => setTab('incidencias')}
                  style={{
                    background: 'var(--neon-card-bg)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid var(--neon-card3-border)',
                    borderRadius: '16px', padding: '24px',
                    cursor: 'pointer', position: 'relative', overflow: 'hidden',
                    boxShadow: 'var(--neon-card3-shadow)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15), var(--neon-card3-shadow)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--neon-card3-shadow)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <p style={{ color: 'var(--text-main)', margin: '0', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.5px' }}>INCIDENCIAS ACTIVAS</p>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--neon-icon3-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s' }}>
                      <AlertTriangle size={20} color="var(--neon-icon3-color)" />
                    </div>
                  </div>
                  <div style={{ color: 'var(--neon-text-num)', fontSize: '2.8rem', fontWeight: 800, lineHeight: 1, display: 'flex', alignItems: 'baseline', gap: '8px', transition: 'color 0.3s' }}>
                    {loadingHome ? '–' : homeStats.incidenciasPendientes} 
                    <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pendientes</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', margin: '14px 0 0 0', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {homeStats.incidenciasNombres && homeStats.incidenciasNombres.length > 0 ? homeStats.incidenciasNombres.join(', ') : 'Sin novedades activas'}
                  </p>
                  
                  {/* Barra de progreso */}
                  <div style={{ marginTop: '16px', height: '4px', background: 'var(--neon-progress-track)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: homeStats.incidenciasPendientes > 0 ? '100%' : '0%', background: 'var(--neon-icon3-color)', borderRadius: '2px', boxShadow: '0 0 10px var(--neon-icon3-color)', transition: 'width 0.8s ease, background 0.3s' }} />
                  </div>
                </div>

              </div>
            </div>

            <div className="glass-card" style={{ padding: '20px 22px', marginBottom: '24px' }}>
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
                <h3 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1rem', fontWeight: 700 }}>Actividad Reciente</h3>
                <button
                  onClick={() => setTab('paradas')}
                  style={{ background: 'transparent', border: 'none', color: 'var(--text-muted)', fontSize: '0.78rem', cursor: 'pointer', fontWeight: 600 }}
                >Ver bitácora →</button>
              </div>

              {loadingHome ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>⏳ Cargando actividad...</div>
              ) : actividadReciente.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '20px 0', color: 'var(--text-muted)', fontSize: '0.85rem' }}>Sin actividad registrada hoy</div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0' }}>
                  {actividadReciente.map((ev, i) => (
                    <div key={i} style={{
                      display: 'flex', alignItems: 'center', gap: '14px',
                      padding: '11px 0',
                      borderBottom: i < actividadReciente.length - 1 ? '1px solid var(--card-border)' : 'none'
                    }}>
                      <span style={{
                        color: ev.tipo === 'incidencia' ? '#e74c3c' : 'rgba(255,255,255,0.35)',
                        fontSize: '0.8rem', fontWeight: 600, minWidth: '58px', flexShrink: 0
                      }}>{ev.hora}</span>
                      <div style={{
                        width: '6px', height: '6px', borderRadius: '50%', flexShrink: 0,
                        background: ev.tipo === 'incidencia' ? '#e74c3c' : '#3b82f6',
                        boxShadow: ev.tipo === 'incidencia' ? '0 0 6px rgba(231,76,60,0.6)' : '0 0 6px rgba(59, 130, 246,0.6)'
                      }} />
                      <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem', flex: 1 }}>{ev.texto}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* ── Accesos Rápidos ── */}
            <p style={{ color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2.5px', margin: '0 0 12px 0' }}>Accesos Rápidos</p>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(150px, 1fr))', gap: '12px' }}>
              {[
                { label: 'Registrar', sub: 'Añadir personal', icon: <UserPlus size={24} />, color: '#3b82f6', tab: 'registro' },
                { label: 'Expedientes', sub: 'Ver personal', icon: <Users size={24} />, color: '#3498db', tab: 'usuarios' },
                { label: 'Unidades', sub: 'Gestionar flota', icon: <Bus size={24} />, color: '#e67e22', tab: 'unidades' },
                { label: 'Incidencias', sub: 'Ver reportes', icon: <AlertTriangle size={24} />, color: '#e74c3c', tab: 'incidencias' },
                { label: 'Paradas', sub: 'Bitácora oficial', icon: <MapPin size={24} />, color: '#1abc9c', tab: 'paradas' },
                { label: 'Reporte', sub: 'Resumen del día', icon: <BarChart2 size={24} />, color: '#9b59b6', tab: 'reporte' },
              ].map((item, i) => (
                <button key={i} onClick={() => setTab(item.tab)} style={{
                  background: 'rgba(255,255,255,0.04)',
                  border: '1px solid rgba(255,255,255,0.07)',
                  borderRadius: '14px', padding: '16px 14px',
                  cursor: 'pointer', textAlign: 'left',
                  transition: 'all 0.22s ease', color: 'var(--text-main)',
                  display: 'flex', flexDirection: 'column', gap: '10px'
                }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; e.currentTarget.style.background = `linear-gradient(135deg, ${item.color}18, ${item.color}05)`; e.currentTarget.style.borderColor = `${item.color}45`; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.07)'; }}>
                  <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: `${item.color}20`, display: 'flex', alignItems: 'center', justifyContent: 'center', color: item.color }}>
                    {item.icon}
                  </div>
                  <div>
                    <div style={{ fontWeight: 700, fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '2px' }}>{item.label}</div>
                    <div style={{ fontSize: '0.72rem', color: 'var(--text-muted)' }}>{item.sub}</div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {tab === 'registro' && (
          <div className="fade-in-tab" style={{ maxWidth: '800px', margin: '0 auto' }}>
            <div style={{ textAlign: 'center', marginBottom: '30px' }}>
              <h2 style={{ color: 'var(--text-main)', margin: '0 0 8px 0', fontSize: '1.8rem', letterSpacing: '1px' }}>REGISTRAR NUEVO EMPLEADO</h2>
              <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.95rem' }}>Completa los datos detallados del personal de Ruta Express</p>
            </div>
            <div className="neon-panel" style={{ padding: '35px' }}>
              <form onSubmit={handleRegistro} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px' }}>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>NOMBRE COMPLETO</label>
                  <input type="text" value={nombre} onChange={(e) => setNombre(e.target.value)} placeholder="Juan Pérez" required style={{ boxSizing: 'border-box', width: '100%', padding: '14px', background: 'var(--card-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', border: '1px solid var(--card-border)', borderRadius: '10px', color: 'var(--text-main)' }} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>ROL DEL USUARIO</label>
                  <div style={{ position: 'relative' }}>
                    <select value={rol} onChange={(e) => setRol(e.target.value)} style={{ boxSizing: 'border-box', width: '100%', padding: '14px', background: 'var(--card-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', color: 'var(--text-main)', border: '1px solid var(--card-border)', borderRadius: '10px', appearance: 'none', cursor: 'pointer' }}>
                      <option value="chofer">🚌 Chofer</option>
                      <option value="fiscal">📋 Fiscal</option>
                      <option value="pasajero">🧑 Pasajero</option>
                    </select>
                    <span style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)', pointerEvents: 'none' }}>▼</span>
                  </div>
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>CORREO ELECTRÓNICO</label>
                  <input type="email" value={correo} onChange={(e) => setCorreo(e.target.value)} placeholder="ej@ruta.com" style={{ boxSizing: 'border-box', width: '100%', padding: '14px', background: 'var(--card-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', border: '1px solid var(--card-border)', borderRadius: '10px', color: 'var(--text-main)' }} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>CÉDULA / USUARIO</label>
                  <input type="text" value={usuarioForm} onChange={(e) => setUsuarioForm(e.target.value)} placeholder="ej: 12345678" required style={{ boxSizing: 'border-box', width: '100%', padding: '14px', background: 'var(--card-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', border: '1px solid var(--card-border)', borderRadius: '10px', color: 'var(--text-main)' }} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>TELÉFONO</label>
                  <input type="text" value={telefono} onChange={(e) => setTelefono(e.target.value)} placeholder="ej: +123 456 789" style={{ boxSizing: 'border-box', width: '100%', padding: '14px', background: 'var(--card-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', border: '1px solid var(--card-border)', borderRadius: '10px', color: 'var(--text-main)' }} />
                </div>
                <div className="input-group" style={{ marginBottom: 0 }}>
                  <label style={{ fontSize: '0.8rem', color: 'var(--text-main)', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '8px', display: 'block' }}>CONTRASEÑA</label>
                  <input type="password" value={clave} onChange={(e) => setClave(e.target.value)} placeholder="Contraseña segura" required style={{ boxSizing: 'border-box', width: '100%', padding: '14px', background: 'var(--card-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', border: '1px solid var(--card-border)', borderRadius: '10px', color: 'var(--text-main)' }} />
                </div>
                <div style={{ gridColumn: '1 / -1', marginTop: '10px' }}>
                  <button type="submit" style={{ width: '100%', padding: '16px', background: '#3b82f6', color: '#000', border: 'none', borderRadius: '10px', fontSize: '1rem', fontWeight: 800, cursor: 'pointer', letterSpacing: '1px', textTransform: 'uppercase', boxShadow: '0 4px 15px rgba(59, 130, 246,0.3)', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(59, 130, 246,0.4)'; }} onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(59, 130, 246,0.3)'; }}>CREAR EMPLEADO</button>
                </div>
              </form>
            </div>
          </div>
        )}

        {tab === 'usuarios' && (
          <div className="fade-in-tab" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <h2 style={{ color: 'var(--text-main)', marginBottom: '20px', fontSize: '1.4rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Directorio y Expedientes Organizados</h2>

            <div style={{ marginBottom: '20px' }}>
              <div style={{ position: 'relative', width: '100%', maxWidth: '500px' }}>
                <span style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
                <input
                  type="text"
                  placeholder="Buscar por nombre, cédula, correo, teléfono..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  style={{ width: '100%', padding: '12px 14px 12px 40px', borderRadius: '10px', border: '1px solid var(--card-border)', background: 'var(--input-bg)', color: 'var(--text-main)', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ display: 'flex', gap: '15px', marginBottom: '25px', overflowX: 'auto', paddingBottom: '5px' }}>
              <button
                onClick={() => setFiltroRol('chofer')}
                style={{ flex: 1, padding: '12px 20px', borderRadius: '12px', border: filtroRol === 'chofer' ? '2px solid #3b82f6' : '1px solid var(--card-border)', background: filtroRol === 'chofer' ? 'rgba(59, 130, 246,0.15)' : 'var(--card-bg)', color: filtroRol === 'chofer' ? '#3b82f6' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minWidth: '150px', transition: 'all 0.2s' }}>
                🚌 CHOFERES
              </button>
              <button
                onClick={() => setFiltroRol('fiscal')}
                style={{ flex: 1, padding: '12px 20px', borderRadius: '12px', border: filtroRol === 'fiscal' ? '2px solid #3498db' : '1px solid var(--card-border)', background: filtroRol === 'fiscal' ? 'rgba(52,152,219,0.15)' : 'var(--card-bg)', color: filtroRol === 'fiscal' ? '#3498db' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minWidth: '150px', transition: 'all 0.2s' }}>
                📋 FISCALES
              </button>
              <button
                onClick={() => setFiltroRol('admin')}
                style={{ flex: 1, padding: '12px 20px', borderRadius: '12px', border: filtroRol === 'admin' ? '2px solid #f39c12' : '1px solid var(--card-border)', background: filtroRol === 'admin' ? 'rgba(243,156,18,0.15)' : 'var(--card-bg)', color: filtroRol === 'admin' ? '#f39c12' : 'var(--text-muted)', fontWeight: 700, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', minWidth: '150px', transition: 'all 0.2s' }}>
                🔒 ADMINISTRADORES
              </button>
            </div>

            {/* Encabezados tabla */}
            <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1.5fr 1fr', padding: '0 20px 10px 20px', color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '1px' }}>
              <div>PERFIL</div>
              <div>DATOS</div>
              <div>CONTACTO</div>
              <div style={{ textAlign: 'center' }}>ESTADO</div>
            </div>

            {usuariosFiltrados.length === 0 ? <div className="neon-panel" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>No hay coincidencias en los expedientes para este rol.</div> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                {usuariosFiltrados.map(u => (
                  <div key={u._id} onClick={() => setUsuarioSeleccionado(u)} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1.5fr 1.5fr 1fr', background: 'var(--card-bg)', padding: '16px 20px', borderRadius: '14px', border: '1px solid var(--card-border)', alignItems: 'center', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'var(--card-bg)'; e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.borderColor = 'var(--card-border)'; }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--card-bg)'; e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.borderColor = 'var(--card-border)'; }}>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                      <div style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', fontSize: '1.2rem', fontWeight: 'bold', flexShrink: 0 }}>
                        {(u.nombre || '?').charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div style={{ color: 'var(--text-main)', fontWeight: 600, fontSize: '0.95rem', textTransform: 'capitalize' }}>{u.nombre} {u.apellido}</div>
                        <div style={{ display: 'inline-block', background: 'var(--card-border)', color: 'var(--text-muted)', padding: '2px 8px', borderRadius: '6px', fontSize: '0.65rem', textTransform: 'uppercase', marginTop: '4px', letterSpacing: '0.5px' }}>{u.rol}</div>
                      </div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cédula: {u.cedula || 'N/A'}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '90%' }}>Correo: {u.correo || 'N/A'}</div>
                    </div>

                    <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Teléfono: {u.telefono || 'N/A'}</div>
                      <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', maxWidth: '90%' }}>Usuario: {u.usuario}</div>
                    </div>

                    <div style={{ display: 'flex', justifyContent: 'center' }}>
                      {u.perfilCompletado ? (
                        <div style={{ border: '1px solid rgba(59, 130, 246,0.3)', background: 'rgba(59, 130, 246,0.1)', color: '#3b82f6', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          ✓ Completo
                        </div>
                      ) : (
                        <div style={{ border: '1px solid rgba(231,76,60,0.3)', background: 'rgba(231,76,60,0.1)', color: '#e74c3c', padding: '6px 12px', borderRadius: '20px', fontSize: '0.75rem', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                          ✕ Incompleto
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {tab === 'unidades' && (
          <div className="fade-in-tab" style={{ maxWidth: '1100px', margin: '0 auto', display: 'flex', flexDirection: 'column', gap: '20px' }}>

            {/* KPI DASHBOARD Y ESTADO DE CHOFERES */}
            <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: '20px' }}>

              <div className="neon-panel" style={{ padding: '20px' }}>
                <h3 style={{ color: 'var(--text-main)', margin: '0 0 15px 0', fontSize: '1.1rem', fontWeight: 800 }}>KPI Dashboard</h3>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>

                  <div style={{ background: 'var(--card-border)', borderRadius: '12px', padding: '15px', border: '1px solid var(--card-border)' }}>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.8rem', fontWeight: 700, marginBottom: '5px', textTransform: 'uppercase' }}>TOTAL UNIDADES</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ color: 'var(--text-main)', fontSize: '2rem', fontWeight: 'bold' }}>{totalUnidades}</span>
                      
                    </div>
                  </div>

                  <div style={{ background: 'rgba(59, 130, 246,0.05)', borderRadius: '12px', padding: '15px', border: '1px solid rgba(59, 130, 246,0.3)' }}>
                    <div style={{ color: '#3b82f6', fontSize: '0.8rem', fontWeight: 700, marginBottom: '5px', textTransform: 'uppercase' }}>OPERATIVAS</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ color: '#3b82f6', fontSize: '2rem', fontWeight: 'bold' }}>{operativas}</span>
                      <span style={{ color: 'rgba(59, 130, 246,0.5)', fontSize: '1.5rem', fontWeight: 'bold' }}>✅</span>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(243,156,18,0.05)', borderRadius: '12px', padding: '15px', border: '1px solid rgba(243,156,18,0.3)' }}>
                    <div style={{ color: '#f39c12', fontSize: '0.8rem', fontWeight: 700, marginBottom: '5px', textTransform: 'uppercase' }}>EN TALLER</div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ color: '#f39c12', fontSize: '2rem', fontWeight: 'bold' }}>{enTaller}</span>
                      <span style={{ color: 'rgba(243,156,18,0.3)', fontSize: '1.5rem', fontWeight: 'bold' }}>🚧</span>
                    </div>
                  </div>

                  <div style={{ background: 'rgba(231,76,60,0.05)', borderRadius: '12px', padding: '15px', border: '1px solid rgba(231,76,60,0.3)' }}>
                    <div style={{ color: '#e74c3c', fontSize: '0.8rem', fontWeight: 700, marginBottom: '5px', textTransform: 'uppercase', display: 'flex', justifyContent: 'space-between' }}>
                      <span>INACTIVAS</span>
                      <span style={{ color: '#e74c3c', opacity: 0.6 }}>ⓘ</span>
                    </div>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'baseline' }}>
                      <span style={{ color: '#e74c3c', fontSize: '2rem', fontWeight: 'bold' }}>{inactivas}</span>
                      <span style={{ fontSize: '1.5rem' }}>🛑</span>
                    </div>
                  </div>

                </div>
              </div>

              <div className="neon-panel" style={{ padding: '20px' }}>
                <h3 style={{ color: 'var(--text-main)', margin: '0 0 15px 0', fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase' }}>ESTADO DE CHOFERES</h3>
                <div style={{ display: 'flex', justifyContent: 'space-around', alignItems: 'center', height: 'calc(100% - 35px)' }}>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: 'var(--text-main)', fontSize: '2rem', fontWeight: 'bold' }}>{totalChoferes}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Total</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#3b82f6', fontSize: '2rem', fontWeight: 'bold' }}>{asignados}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Asignados</div>
                  </div>
                  <div style={{ textAlign: 'center' }}>
                    <div style={{ color: '#f39c12', fontSize: '2rem', fontWeight: 'bold' }}>{libres}</div>
                    <div style={{ color: 'var(--text-muted)', fontSize: '0.9rem', fontWeight: 600 }}>Libres</div>
                  </div>
                </div>
              </div>

            </div>

            {/* TABLA DE FLOTA REGISTRADA */}
            <div className="neon-panel" style={{ padding: '20px' }}>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                  <h3 style={{ color: 'var(--text-main)', margin: 0, fontSize: '1.1rem', fontWeight: 800, textTransform: 'uppercase' }}>FLOTA REGISTRADA</h3>
                  <div style={{ position: 'relative', width: '300px' }}>
                    <input
                      type="text"
                      placeholder="Buscar"
                      value={searchUnidad}
                      onChange={(e) => setSearchUnidad(e.target.value)}
                      style={{ width: '100%', padding: '10px 14px', borderRadius: '8px', border: '1px solid var(--card-border)', background: 'transparent', color: 'var(--text-main)', boxSizing: 'border-box', fontSize: '0.85rem' }}
                    />
                  </div>
                </div>
                <button
                  onClick={() => setMostrarFormUnidad(true)}
                  style={{ background: 'rgba(59, 130, 246,0.15)', color: '#3b82f6', border: '1px solid rgba(59, 130, 246,0.5)', padding: '10px 20px', borderRadius: '8px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '8px', transition: 'all 0.2s', height: 'fit-content' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'rgba(59, 130, 246,0.25)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'rgba(59, 130, 246,0.15)'}
                >
                  + Nuevo Registro
                </button>
              </div>

              {/* Encabezados de Tabla */}
              <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr 1fr 1fr', padding: '12px 16px', borderBottom: '1px solid var(--card-border)', color: 'var(--text-main)', fontSize: '0.9rem', fontWeight: 700 }}>
                <div>ID/Nombre ↑</div>
                <div>Modelo</div>
                <div>Placa</div>
                <div>Chofer Asignado</div>
                <div>Estado</div>
                <div>Acciones</div>
              </div>

              {/* Filas */}
              <div style={{ display: 'flex', flexDirection: 'column' }}>
                {unidadesFiltradas.length === 0 ? <div style={{ padding: '20px', textAlign: 'center', color: 'var(--text-muted)' }}>No se encontraron unidades</div> :
                  unidadesFiltradas.map((un, index) => (
                    <div key={un._id || index} style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr 1fr 1.5fr 1fr 1fr', padding: '14px 16px', borderBottom: '1px solid var(--card-border)', color: 'var(--text-muted)', fontSize: '0.85rem', alignItems: 'center', transition: 'background 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(255,255,255,0.02)'} onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                      <div style={{ fontWeight: 600, color: 'var(--text-main)' }}>{un.nombre}</div>
                      <div>{un.modelo}</div>
                      <div>{un.placa}</div>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        {un.choferAsignado ? (
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'linear-gradient(135deg, #bdc3c7, #95a5a6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', fontSize: '0.7rem', fontWeight: 'bold' }}>
                            {un.choferAsignado.charAt(0).toUpperCase()}
                          </div>
                        ) : (
                          <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--card-border)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-muted)', fontSize: '0.7rem', fontWeight: 'bold' }}>?</div>
                        )}
                        <span>{un.choferAsignado || 'Sin Asignar'}</span>
                      </div>
                      <div>
                        {un.estado === 'Operativa' && <span style={{ background: 'rgba(59, 130, 246,0.1)', border: '1px solid rgba(59, 130, 246,0.3)', color: '#3b82f6', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>Operativa</span>}
                        {(un.estado === 'Mantenimiento' || un.estado === 'En taller') && <span style={{ background: 'rgba(243,156,18,0.1)', border: '1px solid rgba(243,156,18,0.3)', color: '#f39c12', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>En taller</span>}
                        {(un.estado === 'Inhabilitada' || un.estado === 'Inactiva') && <span style={{ background: 'rgba(231,76,60,0.1)', border: '1px solid rgba(231,76,60,0.3)', color: '#e74c3c', padding: '4px 12px', borderRadius: '12px', fontSize: '0.75rem', fontWeight: 600 }}>Inactiva</span>}
                      </div>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <button style={{ background: 'transparent', border: 'none', color: '#3498db', cursor: 'pointer' }} title="Editar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" /><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z" /></svg></button>
                        <button style={{ background: 'transparent', border: 'none', color: '#3b82f6', cursor: 'pointer' }} title="Asignar Chofer"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2" /><circle cx="12" cy="7" r="4" /></svg></button>
                        <button style={{ background: 'transparent', border: 'none', color: '#e74c3c', cursor: 'pointer' }} title="Eliminar"><svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><polyline points="3 6 5 6 21 6" /><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2" /></svg></button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          </div>
        )}

        {tab === 'incidencias' && (
          <div className="fade-in-tab" style={{ maxWidth: '1000px', margin: '0 auto' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
              <h2 style={{ color: 'var(--text-main)', margin: 0 }}>Registro de Novedades</h2>
              <div style={{ display: 'flex', gap: '15px' }}>
                <div style={{ position: 'relative' }}>
                  <span style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-muted)' }}>🔍</span>
                  <input
                    type="text"
                    placeholder="Buscar"
                    value={searchIncidencia}
                    onChange={(e) => setSearchIncidencia(e.target.value)}
                    style={{ padding: '10px 14px 10px 35px', borderRadius: '12px', background: 'var(--card-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--card-border)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', color: 'var(--text-main)', boxSizing: 'border-box', fontSize: '0.85rem' }}
                  />
                </div>
                <select value={filtroIncidencia} onChange={(e) => setFiltroIncidencia(e.target.value)} style={{ padding: '10px 14px', borderRadius: '12px', background: 'var(--card-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--card-border)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', color: 'var(--text-main)', fontSize: '0.85rem', cursor: 'pointer' }}>
                  <option value="Todas">Todas</option>
                  <option value="Pendientes">Pendientes</option>
                  <option value="Resueltas">Resueltas</option>
                </select>
              </div>
            </div>

            {/* Tarjetas de Resumen */}
            <div style={{ display: 'flex', gap: '20px', marginBottom: '30px' }}>
              <div style={{ flex: 1, background: 'linear-gradient(to right, rgba(231,76,60,0.15), rgba(231,76,60,0.05))', border: '1px solid rgba(231,76,60,0.3)', borderRadius: '12px', padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <div style={{ color: '#e74c3c' }}>
                  <svg width="35" height="35" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </div>
                <div>
                  <div style={{ color: '#e74c3c', fontSize: '1.8rem', fontWeight: 800, lineHeight: 1 }}>{criticasCount}</div>
                  <div style={{ color: '#e74c3c', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1px' }}>INCIDENCIAS CRÍTICAS</div>
                </div>
                <div style={{ marginLeft: 'auto', color: '#e74c3c' }}>›</div>
              </div>

              <div style={{ flex: 1, background: 'linear-gradient(to right, rgba(241,196,15,0.15), rgba(241,196,15,0.05))', border: '1px solid rgba(241,196,15,0.3)', borderRadius: '12px', padding: '15px 20px', display: 'flex', alignItems: 'center', gap: '20px', cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.02)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                <div style={{ color: '#f1c40f' }}>
                  <svg width="35" height="35" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z"></path><line x1="12" y1="9" x2="12" y2="13"></line><line x1="12" y1="17" x2="12.01" y2="17"></line></svg>
                </div>
                <div>
                  <div style={{ color: '#f1c40f', fontSize: '1.8rem', fontWeight: 800, lineHeight: 1 }}>{moderadasCount}</div>
                  <div style={{ color: '#f1c40f', fontSize: '0.75rem', fontWeight: 600, letterSpacing: '1px' }}>LOGÍSTICA / MODERADAS</div>
                </div>
                <div style={{ marginLeft: 'auto', color: '#f1c40f' }}>›</div>
              </div>
            </div>

            {incidenciasFiltradas.length === 0 ? <p style={{ textAlign: 'center', color: 'var(--text-muted)' }}>No hay incidencias que coincidan con la búsqueda.</p> : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                {incidenciasFiltradas.map((inc, index) => {
                  const esCritica = inc.severidad === 'Crítica';
                  const mainColor = esCritica ? '#e74c3c' : '#f1c40f';
                  const bgColor = esCritica ? 'rgba(231,76,60,0.15)' : 'rgba(241,196,15,0.15)';

                  return (
                    <div key={inc._id || index} style={{ background: bgColor, border: `1px solid rgba(${esCritica ? '231,76,60' : '241,196,15'}, 0.3)`, borderRadius: '16px', padding: '20px', display: 'flex', gap: '20px', alignItems: 'center', position: 'relative', transition: 'transform 0.2s' }} onMouseEnter={e => e.currentTarget.style.transform = 'scale(1.01)'} onMouseLeave={e => e.currentTarget.style.transform = 'scale(1)'}>
                      <div style={{ color: mainColor, fontSize: '1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '10px' }}>
                        {esCritica ? '🚨' : '⚠️'}
                      </div>
                      <div style={{ flex: 1 }}>
                        <h4 style={{ margin: '0 0 10px 0', color: 'var(--text-main)', fontSize: '1.05rem' }}>{inc.descripcion}</h4>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                          <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'linear-gradient(135deg, #9b59b6, #8e44ad)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-main)', fontSize: '0.7rem', fontWeight: 'bold' }}>
                            {inc.autor ? inc.autor.charAt(0).toUpperCase() : '?'}
                          </div>
                          <span style={{ color: 'var(--text-muted)', fontSize: '0.85rem' }}>Reporta: {inc.autor} ({inc.rol})</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '10px' }}>
                        <span style={{ border: `1px solid ${mainColor}`, color: mainColor, padding: '4px 12px', borderRadius: '20px', fontSize: '0.7rem', fontWeight: 600, textTransform: 'uppercase' }}>{esCritica ? 'CRÍTICA' : 'MODERADA'}</span>
                        <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>{new Date(inc.fecha).toLocaleString()}</span>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {tab === 'paradas' && (
          <div>
            {!paradaAdminSeleccionada ? (
              <div className="parada-list-container fade-in-tab" style={{ maxWidth: '1200px', margin: '0 auto' }}>
                <h2 style={{ color: 'var(--text-main)', marginBottom: '20px' }}>Control Oficial de Paradas</h2>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(360px, 1fr))', gap: '24px' }}>

                  {/* Tarjeta Calderas */}
                  <div className="neon-panel" style={{ background: 'rgba(17, 45, 26, 0.4)', padding: '28px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ color: '#3b82f6', fontSize: '1.2rem' }}>📍</div>
                        <div>
                          <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.4rem', fontWeight: 700 }}>Las Calderas</h3>
                          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Cabecera Principal</p>
                        </div>
                      </div>
                      <button onClick={() => setParadaAdminSeleccionada('CALDERAS')} style={{ background: 'var(--card-border)', border: 'none', color: 'var(--text-main)', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>...</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', color: 'var(--text-main)', fontSize: '0.75rem', fontWeight: 600, borderBottom: '1px solid var(--card-border)', paddingBottom: '10px', marginBottom: '10px' }}>
                      <span>Llegada</span>
                      <span>Unidad</span>
                      <span>Estado</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, maxHeight: '350px', overflowY: 'auto', paddingRight: '5px' }}>
                      {listaLlegadas.filter(ll => ll.parada === 'CALDERAS').slice(0, 8).map((ll, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', color: 'var(--text-main)', fontSize: '0.85rem', alignItems: 'center' }}>
                          <span>{ll.horaLlegada}</span>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ll.nombreUnidad}</span>
                          <span style={{ color: '#3b82f6', fontSize: '0.75rem' }}>Active - OK</span>
                        </div>
                      ))}
                      {listaLlegadas.filter(ll => ll.parada === 'CALDERAS').length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sin registros</span>}
                    </div>
                    <button onClick={() => setParadaAdminSeleccionada('CALDERAS')} style={{ width: '100%', padding: '12px', marginTop: '20px', background: 'rgba(59, 130, 246,0.1)', border: '1px solid rgba(59, 130, 246,0.3)', color: '#3b82f6', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(59, 130, 246,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(59, 130, 246,0.1)'}>Ver Detalles Completos</button>
                  </div>

                  {/* Tarjeta San Antonio */}
                  <div className="neon-panel" style={{ background: 'rgba(42, 33, 8, 0.4)', padding: '28px', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ color: '#f1c40f', fontSize: '1.2rem' }}>📍</div>
                        <div>
                          <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.4rem', fontWeight: 700 }}>San Antonio</h3>
                          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Punto Medio</p>
                        </div>
                      </div>
                      <button onClick={() => setParadaAdminSeleccionada('SAN ANTONIO')} style={{ background: 'var(--card-border)', border: 'none', color: 'var(--text-main)', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>...</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', color: 'var(--text-main)', fontSize: '0.75rem', fontWeight: 600, borderBottom: '1px solid var(--card-border)', paddingBottom: '10px', marginBottom: '10px' }}>
                      <span>Llegada</span>
                      <span>Unidad</span>
                      <span>Estado</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, maxHeight: '350px', overflowY: 'auto', paddingRight: '5px' }}>
                      {listaLlegadas.filter(ll => ll.parada === 'SAN ANTONIO').slice(0, 8).map((ll, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', color: 'var(--text-main)', fontSize: '0.85rem', alignItems: 'center' }}>
                          <span>{ll.horaLlegada}</span>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ll.nombreUnidad}</span>
                          <span style={{ color: '#f1c40f', fontSize: '0.75rem' }}>Active - OK</span>
                        </div>
                      ))}
                      {listaLlegadas.filter(ll => ll.parada === 'SAN ANTONIO').length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sin registros</span>}
                    </div>
                    <button onClick={() => setParadaAdminSeleccionada('SAN ANTONIO')} style={{ width: '100%', padding: '12px', marginTop: '20px', background: 'rgba(241,196,15,0.1)', border: '1px solid rgba(241,196,15,0.3)', color: '#f1c40f', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(241,196,15,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(241,196,15,0.1)'}>Ver Detalles Completos</button>
                  </div>

                  {/* Tarjeta Falcón */}
                  <div style={{ background: '#0f2a38', borderRadius: '24px', padding: '28px', border: '1px solid rgba(52,152,219,0.2)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '20px' }}>
                      <div style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ color: '#3498db', fontSize: '1.2rem' }}>📍</div>
                        <div>
                          <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.4rem', fontWeight: 700 }}>J.C. Falcón</h3>
                          <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.85rem' }}>Retorno</p>
                        </div>
                      </div>
                      <button onClick={() => setParadaAdminSeleccionada('JUAN CRISOSTOMO FALCON')} style={{ background: 'var(--card-border)', border: 'none', color: 'var(--text-main)', borderRadius: '8px', padding: '4px 8px', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 'bold' }}>...</button>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', color: 'var(--text-main)', fontSize: '0.75rem', fontWeight: 600, borderBottom: '1px solid var(--card-border)', paddingBottom: '10px', marginBottom: '10px' }}>
                      <span>Llegada</span>
                      <span>Unidad</span>
                      <span>Estado</span>
                    </div>
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', flex: 1, maxHeight: '350px', overflowY: 'auto', paddingRight: '5px' }}>
                      {listaLlegadas.filter(ll => ll.parada === 'JUAN CRISOSTOMO FALCON').slice(0, 8).map((ll, idx) => (
                        <div key={idx} style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', color: 'var(--text-main)', fontSize: '0.85rem', alignItems: 'center' }}>
                          <span>{ll.horaLlegada}</span>
                          <span style={{ whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ll.nombreUnidad}</span>
                          <span style={{ color: '#3498db', fontSize: '0.75rem' }}>Active - OK</span>
                        </div>
                      ))}
                      {listaLlegadas.filter(ll => ll.parada === 'JUAN CRISOSTOMO FALCON').length === 0 && <span style={{ color: 'var(--text-muted)', fontSize: '0.8rem' }}>Sin registros</span>}
                    </div>
                    <button onClick={() => setParadaAdminSeleccionada('JUAN CRISOSTOMO FALCON')} style={{ width: '100%', padding: '12px', marginTop: '20px', background: 'rgba(52,152,219,0.1)', border: '1px solid rgba(52,152,219,0.3)', color: '#3498db', borderRadius: '12px', fontWeight: 600, cursor: 'pointer', transition: 'all 0.2s' }} onMouseEnter={e => e.currentTarget.style.background = 'rgba(52,152,219,0.2)'} onMouseLeave={e => e.currentTarget.style.background = 'rgba(52,152,219,0.1)'}>Ver Detalles Completos</button>
                  </div>

                </div>
              </div>
            ) : (
              <div className="parada-list-container">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                  <h2 style={{ color: 'var(--text-main)', margin: 0 }}>Llegadas: {paradaAdminSeleccionada}</h2>
                  <button className="btn-login" style={{ width: 'auto', margin: 0, padding: '10px 20px', background: '#7f8c8d' }} onClick={() => setParadaAdminSeleccionada(null)}>⬅ Volver a Paradas</button>
                </div>

                <div style={{ display: 'flex', gap: '40px' }}>
                  <div style={{ flex: '1.5', minWidth: '350px' }}>
                    {listaLlegadas.filter(ll => ll.parada === paradaAdminSeleccionada).length === 0 ? <p>No hay llegadas en esta parada.</p> : (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                        {listaLlegadas.filter(ll => ll.parada === paradaAdminSeleccionada).map(ll => (
                          <div key={ll._id} style={{ background: 'rgba(52, 152, 219, 0.2)', padding: '15px', borderRadius: '12px', borderLeft: '4px solid #3498db', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <div>
                              <h4 style={{ margin: '0 0 5px 0', color: 'var(--text-main)' }}>{ll.nombreUnidad}</h4>
                              <p style={{ margin: '5px 0' }}><strong>Parada:</strong> {ll.parada}</p>
                              <p style={{ margin: '0' }}><strong>Hora Creada:</strong> {ll.horaLlegada}</p>
                            </div>
                            <button onClick={() => abrirEdicion(ll)} style={{ background: 'var(--card-border)', color: 'var(--text-main)', border: 'none', padding: '8px 15px', borderRadius: '5px', cursor: 'pointer' }}>✏️ Forzar Edición</button>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>

                  {editandoId && (
                    <div style={{ flex: '1', maxWidth: '350px' }}>
                      <h3 style={{ color: 'var(--text-main)', marginBottom: '15px' }}>Modificar Llegada Administrador</h3>
                      <form onSubmit={handleModificarLlegada}>
                        <div className="input-group">
                          <label>Estación/Parada</label>
                          <select value={paradaEdit} onChange={(e) => setParadaEdit(e.target.value)} style={{ width: '100%', padding: '12px', background: 'var(--card-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', color: 'var(--text-main)', border: '1.5px solid rgba(59, 130, 246, 0.3)', borderRadius: '12px' }} required>
                            <option value="CALDERAS">CALDERAS</option>
                            <option value="SAN ANTONIO">SAN ANTONIO</option>
                            <option value="JUAN CRISOSTOMO FALCON">JUAN CRISOSTOMO FALCON</option>
                          </select>
                        </div>
                        <div className="input-group">
                          <label>Hora Registrada</label>
                          <input type="time" value={horaEdit} onChange={(e) => setHoraEdit(e.target.value)} required />
                        </div>

                        <div style={{ display: 'flex', gap: '10px' }}>
                          <button type="submit" className="btn-login" style={{ flex: 1, background: '#e74c3c' }}>GUARDAR EDICIÓN</button>
                          <button type="button" onClick={() => setEditandoId(null)} className="btn-login" style={{ flex: 1, background: '#7f8c8d' }}>CANCELAR</button>
                        </div>
                      </form>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {tab === 'reporte' && (
          <div className="fade-in-tab" style={{ maxWidth: '1100px', margin: '0 auto' }}>

            {/* Título */}
            <h2 style={{ color: 'var(--text-main)', fontWeight: 900, fontSize: '1.6rem', letterSpacing: '1px', marginBottom: '28px', textTransform: 'uppercase' }}>
              Resumen de Operaciones Diarias
            </h2>

            {/* Tarjetas de estadísticas grandes */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '32px' }}>
              {[
                { label: 'Total Llegadas Hoy', value: listaLlegadas.length, bg: 'rgba(239, 68, 68, 0.15)', icon: '🚌' },
                { label: 'Unidades Registradas Act.', value: listaUnidades.length, bg: 'rgba(245, 158, 11, 0.15)', icon: '🗂️' },
                { label: 'Operativas', value: listaUnidades.filter(u => u.estado === 'Operativa').length, bg: 'rgba(16, 185, 129, 0.15)', icon: '✅' },
                { label: 'Paradas Activas', value: 3, bg: 'rgba(139, 92, 246, 0.15)', icon: '📍' },
              ].map((stat, i) => (
                <div key={i} className="neon-panel" style={{ background: stat.bg, padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>
                  <div style={{ fontSize: '2.4rem' }}>{stat.icon}</div>
                  <div style={{ color: 'var(--text-main)', fontSize: '2.8rem', fontWeight: 900, lineHeight: 1 }}>{stat.value}</div>
                  <div style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.5px', textAlign: 'center' }}>{stat.label}</div>
                </div>
              ))}
            </div>

            {/* Botón exportar PDF */}
            <div style={{ marginBottom: '32px' }}>
              <button
                onClick={async () => {
                  setGenerandoPDF(true);
                  try {
                    const [resL, resU] = await Promise.all([
                      fetch(`${API_BASE_URL}/api/llegadas`),
                      fetch(`${API_BASE_URL}/api/unidades`)
                    ]);
                    const llegadasFresh = await resL.json();
                    const unidadesFresh = await resU.json();

                    const doc = new jsPDF({ orientation: 'portrait', unit: 'mm', format: 'a4' });
                    const hoy = new Date();
                    const fechaStr = hoy.toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
                    const horaStr = hoy.toLocaleTimeString('es-VE');

                    doc.setFillColor(10, 35, 18);
                    doc.rect(0, 0, 210, 42, 'F');
                    doc.setTextColor(46, 204, 113);
                    doc.setFontSize(19);
                    doc.setFont('helvetica', 'bold');
                    doc.text('RUTA EXPRESS — REPORTE DIARIO (ADMIN)', 105, 16, { align: 'center' });
                    doc.setTextColor(180, 220, 180);
                    doc.setFontSize(9.5);
                    doc.setFont('helvetica', 'normal');
                    doc.text(`Administrador: ${usuario.nombre || 'Admin'}`, 105, 26, { align: 'center' });
                    doc.text(`Fecha: ${fechaStr}  |  Hora generación: ${horaStr}`, 105, 34, { align: 'center' });

                    let y = 52;

                    doc.setTextColor(46, 204, 113); doc.setFontSize(13); doc.setFont('helvetica', 'bold');
                    doc.text('1. FLOTA REGISTRADA', 14, y); y += 5;
                    autoTable(doc, {
                      startY: y,
                      head: [['Unidad', 'Modelo', 'Placa', 'Chofer Asignado', 'Estado']],
                      body: unidadesFresh.map(u => [u.nombre, u.modelo || 'N/A', u.placa || 'N/A', u.choferAsignado || 'Sin asignar', u.estado]),
                      theme: 'grid',
                      headStyles: { fillColor: [15, 80, 40], textColor: [200, 255, 200], fontStyle: 'bold' },
                      alternateRowStyles: { fillColor: [235, 255, 240] },
                      styles: { fontSize: 9, textColor: [30, 30, 30] }
                    });
                    y = doc.lastAutoTable.finalY + 10;

                    if (llegadasFresh.length > 0) {
                      const horasOrd = [...llegadasFresh].filter(ll => ll.horaLlegada).sort((a, b) => a.horaLlegada.localeCompare(b.horaLlegada));
                      doc.setTextColor(46, 204, 113); doc.setFontSize(13); doc.setFont('helvetica', 'bold');
                      doc.text('2. RESUMEN OPERACIONAL DEL DÍA', 14, y); y += 5;
                      autoTable(doc, {
                        startY: y,
                        head: [['Indicador', 'Valor']],
                        body: [
                          ['Total llegadas registradas', llegadasFresh.length],
                          ['Hora inicio operaciones', horasOrd[0]?.horaLlegada || 'N/A'],
                          ['Hora cierre operaciones', horasOrd[horasOrd.length - 1]?.horaLlegada || 'N/A'],
                          ['Unidades operativas', unidadesFresh.filter(u => u.estado === 'Operativa').length],
                          ['Paradas monitoreadas', 3]
                        ],
                        theme: 'striped',
                        headStyles: { fillColor: [20, 60, 35], textColor: [200, 255, 200] },
                        styles: { fontSize: 9 }
                      });
                      y = doc.lastAutoTable.finalY + 10;
                    }

                    const paradas = ['CALDERAS', 'SAN ANTONIO', 'JUAN CRISOSTOMO FALCON'];
                    doc.setTextColor(46, 204, 113); doc.setFontSize(13); doc.setFont('helvetica', 'bold');
                    doc.text('3. DETALLE DE LLEGADAS POR PARADA', 14, y); y += 5;
                    paradas.forEach(parada => {
                      const llParada = llegadasFresh.filter(ll => ll.parada === parada);
                      if (!llParada.length) return;
                      autoTable(doc, { startY: y, head: [[`📍 ${parada} — ${llParada.length} llegada(s)`]], body: [], theme: 'plain', headStyles: { fillColor: [30, 100, 55], textColor: [230, 255, 230], fontStyle: 'bold', fontSize: 10 } });
                      y = doc.lastAutoTable.finalY;
                      autoTable(doc, { startY: y, head: [['#', 'Unidad', 'Hora', 'Registrado por']], body: llParada.map((ll, i) => [i + 1, ll.nombreUnidad || 'N/A', ll.horaLlegada || 'N/A', ll.registradoPor || 'N/A']), theme: 'grid', headStyles: { fillColor: [40, 120, 65], textColor: [255, 255, 255] }, styles: { fontSize: 8 } });
                      y = doc.lastAutoTable.finalY + 8;
                    });

                    const uniqUnidadesGlobal = [...new Set(llegadasFresh.map(ll => ll.nombreUnidad))];
                    const todasLasVueltas = [];
                    uniqUnidadesGlobal.forEach(unidad => {
                      const llU = llegadasFresh.filter(ll => ll.nombreUnidad === unidad);
                      const resV = calcularVueltasPorUnidad(llU);
                      resV.detalles.forEach((d, di) => { todasLasVueltas.push([unidad, `V-${di + 2}/C-${d.numero}`, d.inicio, d.medio, d.fin, d.duracion]); });
                    });
                    if (todasLasVueltas.length > 0) {
                      if (y > 220) { doc.addPage(); y = 20; }
                      doc.setTextColor(46, 204, 113); doc.setFontSize(13); doc.setFont('helvetica', 'bold');
                      doc.text('4. CICLOS DE VUELTAS COMPLETAS', 14, y); y += 6;
                      autoTable(doc, { startY: y, head: [['Unidad', 'Ciclo / Vuelta', 'Calderas (Inicio)', 'San Antonio (Medio)', 'J.C. Falcón (Fin)', 'Duración Total']], body: todasLasVueltas, theme: 'grid', headStyles: { fillColor: [15, 80, 40], textColor: [200, 255, 200], fontStyle: 'bold' }, styles: { fontSize: 8 } });
                    }

                    const pageCount = doc.internal.getNumberOfPages();
                    for (let i = 1; i <= pageCount; i++) {
                      doc.setPage(i); doc.setFontSize(8); doc.setTextColor(150);
                      doc.text(`Ruta Express — Reporte Confidencial | Página ${i} de ${pageCount}`, 105, 290, { align: 'center' });
                    }
                    doc.save(`ReporteAdmin_${hoy.toISOString().split('T')[0]}.pdf`);
                  } catch (err) { console.error(err); alert('Error generando el reporte.'); }
                  setGenerandoPDF(false);
                }}
                disabled={generandoPDF}
                style={{ background: 'linear-gradient(135deg, #e67e22, #d35400)', border: 'none', color: 'var(--text-main)', borderRadius: '12px', padding: '14px 28px', fontWeight: 800, fontSize: '0.95rem', cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '10px', letterSpacing: '0.5px', boxShadow: '0 4px 20px rgba(230,126,34,0.4)', transition: 'all 0.2s' }}
                onMouseEnter={e => e.currentTarget.style.transform = 'translateY(-2px)'}
                onMouseLeave={e => e.currentTarget.style.transform = 'translateY(0)'}
              >
                📄 {generandoPDF ? 'Generando...' : 'EXPORTAR REPORTE PDF'}
              </button>
            </div>

            {/* Tabla de Vueltas Completadas */}
            <div>
              <h4 style={{ color: '#3b82f6', marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '8px', fontSize: '1rem' }}>
                🔄 Vueltas Completadas por las Unidades (Ciclos de 3 Paradas)
              </h4>
              <div className="neon-panel" style={{ overflow: 'hidden' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', color: 'var(--text-main)', fontSize: '0.9rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--card-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--card-border)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)' }}>
                      {['Unidad', 'Ciclo / Vuelta', '📍 Calderas (Inicio)', '📍 San Antonio (Medio)', '📍 J.C. Falcón (Fin)', 'Duración Total'].map((h, i) => (
                        <th key={i} style={{ padding: '14px 16px', textAlign: 'left', color: i === 5 ? '#3b82f6' : 'var(--text-muted)', fontWeight: 600, fontSize: '0.82rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {(() => {
                      const uniqUnidades = [...new Set(listaLlegadas.map(ll => ll.nombreUnidad))];
                      const listVueltas = [];
                      uniqUnidades.forEach(unidad => {
                        const llU = listaLlegadas.filter(ll => ll.nombreUnidad === unidad);
                        const resV = calcularVueltasPorUnidad(llU);
                        resV.detalles.forEach((d, di) => { listVueltas.push({ unidad, ciclo: `V-${di + 2}/C-${d.numero}`, ...d }); });
                      });
                      if (listVueltas.length === 0) {
                        return (
                          <tr>
                            <td colSpan="6" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
                              Ninguna unidad ha completado la secuencia de las 3 paradas hoy todavía.
                            </td>
                          </tr>
                        );
                      }
                      return listVueltas.map((v, idx) => (
                        <tr key={idx} style={{ borderTop: '1px solid var(--card-border)', background: idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent', transition: 'background 0.15s' }}
                          onMouseEnter={e => e.currentTarget.style.background = 'rgba(59, 130, 246,0.06)'}
                          onMouseLeave={e => e.currentTarget.style.background = idx % 2 === 0 ? 'rgba(255,255,255,0.02)' : 'transparent'}>
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: 'var(--text-main)' }}>{v.unidad}</td>
                          <td style={{ padding: '14px 16px', color: '#3498db', fontWeight: 600 }}>{v.ciclo}</td>
                          <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{v.inicio}</td>
                          <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{v.medio}</td>
                          <td style={{ padding: '14px 16px', color: 'var(--text-muted)' }}>{v.fin}</td>
                          <td style={{ padding: '14px 16px', fontWeight: 700, color: '#3b82f6' }}>⏱ {v.duracion}</td>
                        </tr>
                      ));
                    })()}
                  </tbody>
                </table>
              </div>
            </div>

          </div>
        )}

        {tab === 'seguridad' && (
          <div style={{ maxWidth: '520px' }}>
            {/* Card principal */}
            <div style={{ background: '#0f2318', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 20px 60px rgba(0,0,0,0.5)', border: '1px solid rgba(59, 130, 246,0.15)' }}>

              {/* Header verde */}
              <div style={{ background: 'linear-gradient(135deg, #1a4a2e, #0d3320)', padding: '28px 30px' }}>
                <h2 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.5rem', fontWeight: 700 }}>Información de Seguridad</h2>
              </div>

              {/* Contenido */}
              <div style={{ padding: '28px 30px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

                {/* Usuario con avatar y checkmark */}
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                    <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'linear-gradient(135deg, #3b82f6, #1abc9c)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.4rem', fontWeight: 900, color: 'var(--text-main)', flexShrink: 0 }}>
                      {(usuario.nombre || usuario.usuario || 'A').charAt(0).toUpperCase()}
                    </div>
                    <span style={{ color: 'var(--text-main)', fontSize: '1.05rem', fontWeight: 600 }}>
                      Usuario: <span style={{ color: 'var(--text-muted)' }}>{usuario.usuario}</span>
                    </span>
                  </div>
                  <div style={{ width: '28px', height: '28px', borderRadius: '50%', background: '#3b82f6', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="#fff" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round"><polyline points="20 6 9 17 4 12" /></svg>
                  </div>
                </div>

                <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

                {!editandoSeguridad && usuario.preguntaSeguridad ? (
                  <>
                    {/* Pregunta de seguridad */}
                    <div>
                      <p style={{ margin: '0 0 6px 0', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1.5px', fontWeight: 600 }}>Pregunta de Seguridad:</p>
                      <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.15rem', fontWeight: 500 }}>{usuario.preguntaSeguridad}</p>
                    </div>

                    {/* Campo de respuesta oculta */}
                    <div>
                      <input
                        type="password"
                        value="••••••••••"
                        disabled
                        style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', background: 'var(--card-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--card-border)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', color: 'var(--text-muted)', fontSize: '1rem', letterSpacing: '4px', boxSizing: 'border-box', outline: 'none' }}
                      />
                    </div>

                    {/* Botón cambiar */}
                    <button
                      onClick={() => setEditandoSeguridad(true)}
                      style={{ width: '100%', padding: '15px', background: 'rgba(59, 130, 246,0.12)', border: '1.5px solid rgba(59, 130, 246,0.3)', color: '#3b82f6', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', letterSpacing: '1px', transition: 'all 0.2s' }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(59, 130, 246,0.22)'; e.currentTarget.style.borderColor = '#3b82f6'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(59, 130, 246,0.12)'; e.currentTarget.style.borderColor = 'rgba(59, 130, 246,0.3)'; }}
                    >
                      CAMBIAR CONFIGURACIÓN
                    </button>
                  </>
                ) : (
                  <form onSubmit={handleGuardarSeguridad} style={{ display: 'flex', flexDirection: 'column', gap: '18px' }}>
                    <div>
                      <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px', fontWeight: 600 }}>Pregunta de Seguridad</label>
                      <select value={preguntaTmp} onChange={(e) => setPreguntaTmp(e.target.value)} style={{ width: '100%', padding: '14px 16px', background: 'var(--card-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', color: 'var(--text-main)', border: '1px solid rgba(59, 130, 246,0.25)', borderRadius: '12px', fontSize: '0.9rem', boxSizing: 'border-box' }}>
                        <option>¿Cuál es el nombre de tu primera mascota?</option>
                        <option>¿En qué ciudad naciste?</option>
                        <option>¿Cuál es el apellido de tu madre?</option>
                        <option>¿Cuál fue el nombre de tu primera escuela?</option>
                        <option>¿Cuál es tu color favorito?</option>
                      </select>
                    </div>
                    <div>
                      <label style={{ display: 'block', color: 'var(--text-muted)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '1.5px', marginBottom: '8px', fontWeight: 600 }}>Tu Respuesta Secreta</label>
                      <input type="text" value={respuestaTmp} onChange={(e) => setRespuestaTmp(e.target.value)} placeholder="Ej: Toby / Caracas / Pérez..." required
                        style={{ width: '100%', padding: '14px 16px', borderRadius: '12px', background: 'var(--card-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--card-border)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', color: 'var(--text-main)', fontSize: '0.9rem', boxSizing: 'border-box', outline: 'none' }} />
                    </div>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button type="submit" disabled={guardandoSeg}
                        style={{ flex: 1, padding: '14px', background: 'linear-gradient(135deg, #3b82f6, #1abc9c)', border: 'none', color: 'var(--text-main)', borderRadius: '12px', fontWeight: 700, fontSize: '0.9rem', cursor: 'pointer', letterSpacing: '0.5px' }}>
                        {guardandoSeg ? 'GUARDANDO...' : '✅ GUARDAR'}
                      </button>
                      {usuario.preguntaSeguridad && (
                        <button type="button" onClick={() => setEditandoSeguridad(false)}
                          style={{ padding: '14px 20px', background: 'rgba(255,255,255,0.07)', border: '1px solid var(--card-border)', color: 'var(--text-main)', borderRadius: '12px', cursor: 'pointer', fontWeight: 600 }}>
                          CANCELAR
                        </button>
                      )}
                    </div>
                  </form>
                )}
              </div>
            </div>
          </div>
        )}

      </main>

      {/* MODAL DETALLE DE USUARIO */}
      {usuarioSeleccionado && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.25s' }}>
          <div className="neon-panel" style={{ padding: '40px', width: '90%', maxWidth: '500px', position: 'relative', animation: 'cardEntrance 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <button onClick={() => setUsuarioSeleccionado(null)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'var(--card-border)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-main)', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(231,76,60,0.2)'; e.currentTarget.style.color = '#e74c3c'; }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--card-border)'; e.currentTarget.style.color = '#fff'; }}>✕</button>

            <h2 style={{ margin: '0 0 20px 0', color: 'var(--text-main)', fontSize: '1.6rem', textAlign: 'center', borderBottom: '1px solid var(--card-border)', paddingBottom: '15px' }}>
              Detalles del Expediente
            </h2>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', color: 'var(--text-muted)', fontSize: '0.95rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '50%', background: 'linear-gradient(135deg, #f39c12, #e67e22)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.8rem', fontWeight: 900, color: 'var(--text-main)' }}>
                  {(usuarioSeleccionado.nombre || '?').charAt(0).toUpperCase()}
                </div>
                <div>
                  <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.2rem', textTransform: 'capitalize' }}>
                    {usuarioSeleccionado.nombre} {usuarioSeleccionado.apellido || ''}
                  </h3>
                  <span style={{ background: 'rgba(243,156,18,0.15)', color: '#f39c12', fontSize: '0.75rem', padding: '2px 8px', borderRadius: '6px', textTransform: 'uppercase', fontWeight: 600 }}>
                    {usuarioSeleccionado.rol}
                  </span>
                </div>
              </div>

              <div style={{ height: '1px', background: 'rgba(255,255,255,0.06)' }} />

              <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: '12px' }}>
                <p style={{ margin: 0 }}><strong>👤 Usuario:</strong> {usuarioSeleccionado.usuario}</p>
                <p style={{ margin: 0 }}><strong>🪪 Cédula:</strong> {usuarioSeleccionado.cedula || 'N/A'}</p>
                <p style={{ margin: 0 }}><strong>📧 Correo:</strong> {usuarioSeleccionado.correo || 'N/A'}</p>
                <p style={{ margin: 0 }}><strong>📞 Teléfono:</strong> {usuarioSeleccionado.telefono || 'N/A'}</p>
                <p style={{ margin: 0 }}><strong>📍 Dirección:</strong> {usuarioSeleccionado.direccion || 'N/A'}</p>
                <p style={{ margin: 0 }}>
                  <strong>⚙️ Estado Perfil:</strong>{' '}
                  <span style={{ color: usuarioSeleccionado.perfilCompletado ? '#3b82f6' : '#e74c3c', fontWeight: 600 }}>
                    {usuarioSeleccionado.perfilCompletado ? 'Completado' : 'Pendiente por completar'}
                  </span>
                </p>
                {usuarioSeleccionado.preguntaSeguridad && (
                  <p style={{ margin: 0 }}><strong>🔐 Pregunta de Seguridad:</strong> {usuarioSeleccionado.preguntaSeguridad}</p>
                )}
              </div>
            </div>

            <button onClick={() => setUsuarioSeleccionado(null)} className="btn-login" style={{ background: 'linear-gradient(135deg,#f39c12,#e67e22)', color: '#000', marginTop: '30px', fontWeight: 800, width: '100%' }}>
              ⬅ VOLVER AL DIRECTORIO
            </button>
          </div>
        </div>
      )}

      {/* MODAL REGISTRO DE UNIDAD */}
      {mostrarFormUnidad && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 9999, display: 'flex', alignItems: 'center', justifyContent: 'center', animation: 'fadeIn 0.25s' }}>
          <div className="neon-panel" style={{ padding: '40px', width: '90%', maxWidth: '500px', position: 'relative', animation: 'cardEntrance 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>
            <button onClick={() => setMostrarFormUnidad(false)} style={{ position: 'absolute', top: '20px', right: '20px', background: 'var(--card-border)', border: 'none', width: '36px', height: '36px', borderRadius: '50%', color: 'var(--text-main)', fontSize: '1.2rem', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'all 0.2s' }} onMouseEnter={e => { e.currentTarget.style.background = 'rgba(231,76,60,0.2)'; e.currentTarget.style.color = '#e74c3c'; }} onMouseLeave={e => { e.currentTarget.style.background = 'var(--card-border)'; e.currentTarget.style.color = '#fff'; }}>✕</button>

            <h2 style={{ margin: '0 0 20px 0', color: 'var(--text-main)', fontSize: '1.6rem', textAlign: 'center' }}>Registrar Nueva Unidad</h2>

            <form onSubmit={handleRegistroUnidad}>
              <div className="input-group">
                <label style={{ fontSize: '0.8rem', color: '#3b82f6', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>Nombre/Identificador</label>
                <input type="text" placeholder="Ej: Bus 01" value={nombreUnidad} onChange={(e) => setNombreUnidad(e.target.value)} required style={{ width: '100%', padding: '14px', background: 'var(--card-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', color: 'var(--text-main)', border: '1px solid var(--card-border)', borderRadius: '10px', boxSizing: 'border-box' }} />
              </div>
              <div className="input-group">
                <label style={{ fontSize: '0.8rem', color: '#aaa', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>Modelo / Marca</label>
                <input type="text" placeholder="Ej: Encava 2021" value={modelo} onChange={(e) => setModelo(e.target.value)} required style={{ width: '100%', padding: '14px', background: 'var(--card-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', color: 'var(--text-main)', border: '1px solid var(--card-border)', borderRadius: '10px', boxSizing: 'border-box' }} />
              </div>
              <div className="input-group">
                <label style={{ fontSize: '0.8rem', color: '#aaa', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>Placa</label>
                <input type="text" placeholder="Ej: AA22BB" value={placa} onChange={(e) => setPlaca(e.target.value)} required style={{ width: '100%', padding: '14px', background: 'var(--card-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', color: 'var(--text-main)', border: '1px solid var(--card-border)', borderRadius: '10px', boxSizing: 'border-box' }} />
              </div>
              <div className="input-group">
                <label style={{ fontSize: '0.8rem', color: '#aaa', fontWeight: 600, letterSpacing: '0.5px', marginBottom: '8px', display: 'block', textTransform: 'uppercase' }}>Estado Inicial</label>
                <select value={estadoUnidad} onChange={(e) => setEstadoUnidad(e.target.value)} style={{ width: '100%', padding: '14px', background: 'var(--card-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', color: 'var(--text-main)', border: '1px solid var(--card-border)', borderRadius: '10px', boxSizing: 'border-box' }}>
                  <option value="Operativa">Operativa</option>
                  <option value="Mantenimiento">En taller</option>
                  <option value="Inhabilitada">Inactiva</option>
                </select>
              </div>
              <SearchableSelector
                label="Chofer Asignado (Flotante)"
                placeholder="🔍 Escribe para buscar chofer..."
                options={[
                  { id: '', name: '-- Sin asignar --' },
                  ...choferesArray.map(c => ({ id: c.nombre, name: `${c.nombre} (${c.usuario})` }))
                ]}
                value={choferAsig}
                onChange={(val) => setChoferAsig(val)}
              />
              <button type="submit" className="btn-login" style={{ background: '#3b82f6', color: '#000', marginTop: '20px', fontWeight: 800 }}>REGISTRAR VEHÍCULO</button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

export default Admin;