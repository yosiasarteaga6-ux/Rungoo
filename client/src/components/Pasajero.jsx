import React, { useState, useEffect, useRef } from 'react';
import ThemeToggle from './ThemeToggle';
import CompletarPerfil from './CompletarPerfil';
import Clock from './Clock';
import L from 'leaflet';
import 'leaflet/dist/leaflet.css';
import API_BASE_URL from '../config';

function Pasajero({ usuario, onLogout, onUpdateUser }) {
  const [tab, setTab] = useState('mapa'); // mapa | horarios | novedad | expediente | seguridad
  const [menuAbierto, setMenuAbierto] = useState(false);
  const [mapLayerType, setMapLayerType] = useState('streets'); // dark | streets | satellite
  const [incidencia, setIncidencia] = useState('');
  const [listaLlegadas, setListaLlegadas] = useState([]);
  const [setListaUnidades] = useState([]);
  const [paradaSeleccionada, setParadaSeleccionada] = useState(null);

  // Estados para Seguridad
  const [editandoSeguridad, setEditandoSeguridad] = useState(false);
  const [preguntaTmp, setPreguntaTmp] = useState(usuario.preguntaSeguridad || '¿Cuál es el nombre de tu primera mascota?');
  const [respuestaTmp, setRespuestaTmp] = useState('');
  const [guardandoSeg, setGuardandoSeg] = useState(false);

  // Referencias para el mapa Leaflet
  const mapRef = useRef(null);
  const mapInstanceRef = useRef(null);

  const nombrePasajero = usuario ? `${usuario.nombre} ${usuario.apellido || ''}`.trim() : "Pasajero Anónimo";

  // Cargar datos del servidor
  const fetchDatos = async () => {
    try {
      const resLlegadas = await fetch(`${API_BASE_URL}/api/llegadas`);
      const dataLlegadas = await resLlegadas.json();
      setListaLlegadas(dataLlegadas);

      const resUnidades = await fetch(`${API_BASE_URL}/api/unidades`);
      const dataUnidades = await resUnidades.json();
      setListaUnidades(dataUnidades);
    } catch (err) {
      console.error("Error al obtener datos:", err);
    }
  };

  useEffect(() => {
    fetchDatos();
    // Polling de llegadas cada 15 segundos para dar sensación de tiempo real
    const intervalo = setInterval(fetchDatos, 15000);
    return () => clearInterval(intervalo);
  }, []);

  // Inicializar o actualizar el mapa de Leaflet
  useEffect(() => {
    if (tab !== 'mapa') return;
    if (!mapRef.current) return;

    // Destruir mapa anterior si existía para evitar colisiones
    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }

    // Coordenadas de las paradas
    const paradasCoords = {
      'JUAN CRISOSTOMO FALCON': [11.388987, -69.675065],
      'SAN ANTONIO': [11.400541, -69.671707],
      'CALDERAS': [11.4145, -69.6250]
    };

    // Crear el mapa con límites geográficos estrictos (maxBounds) y zooms configurados
    const map = L.map(mapRef.current, {
      center: [11.4145, -69.6500], // Centrado conveniente en el corredor Coro-Calderas
      zoom: 13,
      minZoom: 12,
      maxZoom: 17,
      maxBounds: [[11.3800, -69.7200], [11.4600, -69.5800]], // Límites del corredor
      maxBoundsViscosity: 1.0 // Evita que el usuario arrastre fuera de los límites
    });

    mapInstanceRef.current = map;

    // Capa de mapa con diseño dinámico
    const urls = {
      dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
      streets: 'https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png',
      satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{x}/{y}'
    };
    const attributions = {
      dark: '&copy; CARTO',
      streets: '&copy; CARTO &copy; OpenStreetMap',
      satellite: 'Tiles &copy; Esri &mdash; Source: Esri'
    };

    L.tileLayer(urls[mapLayerType] || urls.dark, {
      attribution: attributions[mapLayerType] || attributions.dark
    }).addTo(map);

    // Dibujar el recorrido de la ruta como una línea continua de color verde esmeralda brillante (según indicaciones)
    const routeCoords = [
      [11.388987, -69.675065], // 1. Salida: J.C. Falcón
      [11.391000, -69.674000], // 2. Prol Av Sucre
      [11.390000, -69.672000], // 3. Cruza derecha Av El Tenis
      [11.388000, -69.673000], // 4. Cruza derecha Av Sta Rosa
      [11.389500, -69.674500], // 5. Cruza derecha Av Ruiz Pineda
      [11.395000, -69.672000], // 6. Cruza izquierda bajando por Av Manaure
      [11.400541, -69.671707], // 7. Punto de control SAN ANTONIO
      [11.402000, -69.671500], // 8. Sigue bajando
      [11.402000, -69.668000], // 9. Cruza derecha por Av Rómulo Gallegos
      [11.407000, -69.668000], // 10. Cruza derecha por Av del terminal
      [11.409200, -69.671800], // 11. Llega a TRES PLATOS
      [11.411100, -69.653400], // 12. Cruza derecha por Av Independencia (Farmatodo)
      [11.412500, -69.635000], // 13. Sigue hacia el este
      [11.414500, -69.625000]  // 14. Llega a CALDERAS
    ];

    L.polyline(routeCoords, {
      color: '#3b82f6',
      weight: 6,
      opacity: 0.9,
      dashArray: '10, 15',
      className: 'leaflet-route-polyline' // Para estilos CSS y animaciones fluidas
    }).addTo(map);

    // Agregar los marcadores personalizados con DivIcon de Leaflet (SVG vibrante animado)
    const paradasInfo = [
      { key: 'JUAN CRISOSTOMO FALCON', nombre: '📍 Salida: J.C. Falcón', desc: 'Punto de partida de la ruta (Oeste).' },
      { key: 'SAN ANTONIO', nombre: '📍 Punto Medio: Plaza San Antonio', desc: 'Punto de control intermedio.' },
      { key: 'CALDERAS', nombre: '📍 Llegada: Las Calderas', desc: 'Llegada y cabecera principal (Este).' }
    ];

    paradasInfo.forEach(p => {
      const icon = L.divIcon({
        html: `
          <div class="glow-marker-wrapper" id="marker-${p.key}">
            <div class="glow-marker-ring"></div>
            <div class="glow-marker-dot" style="display:flex; justify-content:center; align-items:center; font-size:12px;">🚌</div>
          </div>
        `,
        className: 'glow-leaflet-marker',
        iconSize: [24, 24],
        iconAnchor: [12, 12]
      });

      const marker = L.marker(paradasCoords[p.key], { icon }).addTo(map);

      // Evento al hacer clic en el marcador
      marker.on('click', () => {
        setParadaSeleccionada(p.key);
      });

      // Crear Popups elegantes con diseño CSS acoplado
      marker.bindPopup(`
        <div class="leaflet-popup-premium">
          <h4>${p.nombre}</h4>
          <p>${p.desc}</p>
          <small style="color: #3b82f6; font-weight: bold; display: block; margin-top: 5px;">✨ Presiona para ver horarios recientes abajo</small>
        </div>
      `);
    });

    return () => {
      if (mapInstanceRef.current) {
        mapInstanceRef.current.remove();
        mapInstanceRef.current = null;
      }
    };
  }, [tab, mapLayerType]);

  // Completar Perfil del Pasajero si está incompleto
  if (usuario && !usuario.perfilCompletado) {
    return <CompletarPerfil usuario={usuario} onCompletado={onUpdateUser} onLogout={onLogout} />;
  }

  // Reportar Novedad/Incidencia como Pasajero
  const handleEnviarIncidencia = async (e) => {
    e.preventDefault();
    if (!incidencia.trim()) return;
    try {
      const resp = await fetch(`${API_BASE_URL}/api/incidencias`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ descripcion: incidencia, autor: nombrePasajero, rol: 'Pasajero' })
      });
      if (resp.ok) {
        alert("¡Reporte enviado! El administrador lo revisará pronto. Gracias por ayudarnos a mejorar.");
        setIncidencia('');
      } else {
        alert("Hubo un error al enviar tu reporte.");
      }
    } catch (error) {
      alert("Error de conexión con el servidor.");
    }
  };

  // Guardar configuración de seguridad
  const handleGuardarSeguridad = async (e) => {
    e.preventDefault();
    if (!respuestaTmp) {
      alert("Por favor, escribe una respuesta secreta.");
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
        alert("Seguridad y pregunta de recuperación actualizadas exitosamente.");
        onUpdateUser({ ...usuario, preguntaSeguridad: preguntaTmp });
        setEditandoSeguridad(false);
        setRespuestaTmp('');
      } else {
        alert("Error al actualizar la configuración de seguridad.");
      }
    } catch (err) {
      alert("Error de conexión con el servidor.");
    }
    setGuardandoSeg(false);
  };

  const getSidebarClass = (current) => tab === current ? 'sidebar-btn active' : 'sidebar-btn';
  const cerrarMenu = () => setMenuAbierto(false);

  // Filtrar llegadas por la parada seleccionada en tiempo real
  const llegadasFiltradas = paradaSeleccionada 
    ? listaLlegadas.filter(ll => ll.parada === paradaSeleccionada) 
    : listaLlegadas;

  return (
    <div className="dashboard-container">
      {/* Botón hamburguesa (solo móvil) */}
      <button className="hamburger-btn" onClick={() => setMenuAbierto(!menuAbierto)} aria-label="Menú">
        <span className="hamburger-bar"></span>
        <span className="hamburger-bar"></span>
        <span className="hamburger-bar"></span>
      </button>
      {/* Overlay oscuro al abrir sidebar en móvil */}
      {menuAbierto && <div className="sidebar-overlay visible" onClick={cerrarMenu} />}
      {/* MENÚ LATERAL PASAJERO */}
      <aside className={`sidebar${menuAbierto ? ' sidebar-open' : ''}`}>
        <div className="sidebar-profile">
          <img src="/logo.png" alt="Ruta Express Logo" style={{ width: '120px', height: 'auto', marginBottom: '12px', filter: 'drop-shadow(0 3px 8px rgba(0,0,0,0.4))' }} onError={(e) => e.target.style.display = 'none'} />
          <h3>Bienvenido,</h3>
          <h3 style={{ color: '#3b82f6', fontSize: '1.4rem', margin: '0 0 5px 0' }}>{usuario.nombre}</h3>
          <p>Pasajero de la Red</p>
          <div style={{ color: '#3498db', marginTop: '10px', fontSize: '0.85rem', marginBottom: '15px' }}>📱 Vista Ciudadana</div>
        </div>

        <Clock />

        <nav className="sidebar-menu">
          <button className={getSidebarClass('mapa')} onClick={() => { setTab('mapa'); setParadaSeleccionada(null); cerrarMenu(); }}>
            📍 Mapa de Ruta
          </button>
          <button className={getSidebarClass('horarios')} onClick={() => { setTab('horarios'); setParadaSeleccionada(null); cerrarMenu(); }}>
            📋 Bitácora Completa
          </button>
          <button className={getSidebarClass('novedad')} onClick={() => { setTab('novedad'); cerrarMenu(); }}>
            📣 Reportar Problema
          </button>
          <button className={getSidebarClass('expediente')} onClick={() => { setTab('expediente'); cerrarMenu(); }}>
            👤 Mi Expediente
          </button>
          <button className={getSidebarClass('seguridad')} onClick={() => { setTab('seguridad'); cerrarMenu(); }}>
            🔐 Seguridad
          </button>
        </nav>

        <ThemeToggle style={{ width: "100%", marginBottom: "10px", justifyContent: "center" }} />
        <button onClick={onLogout} style={{ marginTop: 'auto', background: 'transparent', border: '1px solid #e74c3c', color: '#e74c3c', padding: '10px', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}>
          🚪 Cerrar Sesión
        </button>
      </aside>

      {/* CONTENIDO PRINCIPAL */}
      <main className="main-content">
        <div className="main-header" style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
          {tab !== 'mapa' && (
            <button onClick={() => setTab('mapa')} style={{ background: 'transparent', border: 'none', color: 'var(--text-main)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '5px', fontSize: '1rem', padding: '5px' }}>
              <span style={{ fontSize: '1.2rem' }}>⬅</span> Regresar
            </button>
          )}
          <h2>
            {tab === 'mapa' && '📍 Mapa y Tiempos en Tiempo Real'}
            {tab === 'horarios' && '📋 Bitácora General de Horarios'}
            {tab === 'novedad' && '📣 Cuéntanos qué sucede en la Ruta'}
            {tab === 'expediente' && '👤 Mi Perfil de Pasajero'}
            {tab === 'seguridad' && '🔐 Configuración de Seguridad Ciudadana'}
          </h2>
        </div>

        {/* PESTAÑA 1: MAPA INTERACTIVO */}
        {tab === 'mapa' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <p className="slogan" style={{ margin: 0 }}>
              Selecciona una parada en el mapa para ver los últimos arribos en tiempo real. El mapa está limitado al área metropolitana de Coro y Las Calderas.
            </p>

            <div style={{ display: 'flex', gap: '25px', flexWrap: 'wrap' }}>
              {/* Contenedor del Mapa */}
              <div style={{ flex: '2', minWidth: '350px', position: 'relative' }}>
                {/* Selector de Capas de Mapa Flotante */}
                <div className="map-layer-selector">
                  <button type="button" onClick={() => setMapLayerType('dark')} className={mapLayerType === 'dark' ? 'active' : ''}>🕶️ Oscuro</button>
                  <button type="button" onClick={() => setMapLayerType('streets')} className={mapLayerType === 'streets' ? 'active' : ''}>🗺️ Calles</button>
                  <button type="button" onClick={() => setMapLayerType('satellite')} className={mapLayerType === 'satellite' ? 'active' : ''}>🛰️ Satélite</button>
                </div>
                
                <div 
                  ref={mapRef} 
                  style={{ 
                    height: '480px', 
                    width: '100%', 
                    borderRadius: '16px', 
                    border: '1.5px solid rgba(59, 130, 246, 0.25)', 
                    boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
                    overflow: 'hidden'
                  }} 
                />
              </div>

              {/* Panel de Tiempos de Parada */}
              <div style={{ flex: '1', minWidth: '280px', background: 'rgba(28, 40, 51, 0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', padding: '20px', borderRadius: '16px', border: '1px solid rgba(255,255,255,0.06)', display: 'flex', flexDirection: 'column' }}>
                <h3 style={{ color: 'var(--text-main)', fontSize: '1.1rem', marginTop: 0, marginBottom: '15px', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span>{paradaSeleccionada ? `📍 Arribos: ${paradaSeleccionada}` : '📍 Selecciona una Parada'}</span>
                  {paradaSeleccionada && (
                    <button 
                      onClick={() => setParadaSeleccionada(null)} 
                      style={{ 
                        background: 'rgba(255,255,255,0.08)', 
                        border: 'none', 
                        borderRadius: '6px', 
                        color: 'var(--text-muted)', 
                        padding: '2px 8px', 
                        cursor: 'pointer', 
                        fontSize: '0.8rem',
                        transition: 'all 0.2s'
                      }}
                      onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.15)'; e.currentTarget.style.color = '#fff'; }}
                      onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.08)'; e.currentTarget.style.color = 'rgba(255,255,255,0.6)'; }}
                    >
                      ✕ Limpiar
                    </button>
                  )}
                </h3>

                {!paradaSeleccionada ? (
                  <div style={{ textAlign: 'center', margin: 'auto', padding: '20px', color: 'var(--text-muted)' }}>
                    <div style={{ fontSize: '2.5rem', marginBottom: '10px' }}>🚌</div>
                    <p style={{ fontSize: '0.9rem', margin: 0 }}>Haz clic sobre cualquiera de las paradas en el mapa para desplegar los tiempos y buses recientes.</p>
                  </div>
                ) : (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', overflowY: 'auto', maxHeight: '350px', paddingRight: '5px' }}>
                    {llegadasFiltradas.length === 0 ? (
                      <p style={{ color: 'var(--text-muted)', fontSize: '0.9rem', textAlign: 'center', margin: '20px 0' }}>
                        No se han registrado llegadas de buses el día de hoy en esta estación.
                      </p>
                    ) : (
                      llegadasFiltradas.slice(0, 5).map((ll, idx) => (
                        <div 
                          key={ll._id || idx} 
                          style={{ 
                            background: 'linear-gradient(135deg, rgba(59, 130, 246,0.12), rgba(39,174,96,0.02))', 
                            padding: '12px 15px', 
                            borderRadius: '10px', 
                            borderLeft: '4px solid #3b82f6',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center'
                          }}
                        >
                          <div>
                            <h4 style={{ margin: '0 0 2px 0', color: 'var(--text-main)', fontSize: '0.95rem' }}>{ll.nombreUnidad}</h4>
                            <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Fiscal: {ll.registradoPor || 'N/A'}</span>
                          </div>
                          <div style={{ textAlign: 'right' }}>
                            <div style={{ color: '#3b82f6', fontWeight: 'bold', fontSize: '1.1rem' }}>{ll.horaLlegada}</div>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>Registrado</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 2: BITÁCORA COMPLETA */}
        {tab === 'horarios' && (
          <div style={{ maxWidth: '800px' }}>
            <p className="slogan">Listado general histórico con todos los arribos registrados por los fiscales en toda la ruta.</p>
            {listaLlegadas.length === 0 ? (
              <p style={{ color: 'var(--text-muted)' }}>No hay horarios en la base de datos.</p>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '550px', overflowY: 'auto', paddingRight: '10px' }}>
                {listaLlegadas.map((ll, idx) => (
                  <div 
                    key={ll._id || idx} 
                    style={{ 
                      background: 'rgba(28, 40, 51, 0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', 
                      padding: '15px 20px', 
                      borderRadius: '12px', 
                      borderLeft: '4px solid #3498db',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      border: '1px solid rgba(255,255,255,0.05)'
                    }}
                  >
                    <div>
                      <h4 style={{ margin: '0 0 5px 0', color: 'var(--text-main)', fontSize: '1rem' }}>{ll.nombreUnidad}</h4>
                      <p style={{ margin: 0, fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        📍 Estación: <strong style={{ color: 'var(--text-main)' }}>{ll.parada}</strong>
                      </p>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <div style={{ color: '#3498db', fontWeight: 'bold', fontSize: '1.2rem' }}>{ll.horaLlegada}</div>
                      <small style={{ color: 'var(--text-muted)', fontSize: '0.75rem' }}>
                        {ll.fecha ? new Date(ll.fecha).toLocaleDateString() : 'Hoy'}
                      </small>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* PESTAÑA 3: REPORTAR PROBLEMA */}
        {tab === 'novedad' && (
          <div style={{ background: 'rgba(28, 40, 51, 0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', padding: '25px', borderRadius: '16px', maxWidth: '600px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h4 style={{ margin: '0 0 10px 0', color: '#e74c3c', fontSize: '1.1rem' }}>📢 Envía un Reporte Ciudadano</h4>
            <p style={{ color: 'var(--text-muted)', fontSize: '0.85rem', marginBottom: '20px' }}>
              ¿Has notado retrasos excesivos, conductas inapropiadas o problemas con las unidades? Envíanos tu reporte. Será procesado por la administración para mejorar el servicio.
            </p>
            <form onSubmit={handleEnviarIncidencia} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
              <textarea 
                value={incidencia} 
                onChange={(e) => setIncidencia(e.target.value)} 
                placeholder="Ejemplo: La unidad Bus 03 tiene retraso de más de 20 minutos en la parada de San Antonio..." 
                rows="5" 
                style={{ 
                  width: '94%', 
                  padding: '15px', 
                  borderRadius: '10px', 
                  border: '1.5px solid rgba(231, 76, 60, 0.2)', 
                  background: 'rgba(28, 40, 51, 0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', 
                  color: 'var(--text-main)', 
                  resize: 'none',
                  outline: 'none',
                  fontSize: '0.95rem'
                }} 
                required 
              />
              <button type="submit" className="btn-login" style={{ background: '#e74c3c', maxWidth: '250px', fontWeight: 'bold' }}>
                🚀 ENVIAR AL PANEL CENTRAL
              </button>
            </form>
          </div>
        )}

        {/* PESTAÑA 4: MI EXPEDIENTE */}
        {tab === 'expediente' && (
          <div style={{ background: 'rgba(28, 40, 51, 0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', padding: '30px', borderRadius: '16px', maxWidth: '600px', border: '1px solid rgba(255,255,255,0.05)' }}>
            <h3 style={{ color: '#3b82f6', marginBottom: '20px', fontSize: '1.2rem', borderBottom: '1px solid rgba(255,255,255,0.1)', paddingBottom: '10px' }}>👤 Información del Ciudadano</h3>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '20px 15px' }}>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Nombre Completo</span>
                <p style={{ margin: '3px 0 0 0', fontWeight: 'bold', color: 'var(--text-main)' }}>{usuario.nombre} {usuario.apellido || ''}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Cédula / Documento</span>
                <p style={{ margin: '3px 0 0 0', fontWeight: 'bold', color: 'var(--text-main)' }}>{usuario.cedula || 'N/A'}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Teléfono</span>
                <p style={{ margin: '3px 0 0 0', fontWeight: 'bold', color: 'var(--text-main)' }}>{usuario.telefono || 'N/A'}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Correo Electrónico</span>
                <p style={{ margin: '3px 0 0 0', fontWeight: 'bold', color: 'var(--text-main)' }}>{usuario.correo || 'N/A'}</p>
              </div>
              <div style={{ gridColumn: '1 / -1' }}>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Dirección Registrada</span>
                <p style={{ margin: '3px 0 0 0', fontWeight: 'bold', color: 'var(--text-main)' }}>{usuario.direccion || 'N/A'}</p>
              </div>
              <div>
                <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Rol asignado</span>
                <p style={{ margin: '3px 0 0 0', color: '#3b82f6', fontWeight: 'bold' }}>PASAJERO CIUDADANO</p>
              </div>
            </div>
          </div>
        )}

        {/* PESTAÑA 5: SEGURIDAD */}
        {tab === 'seguridad' && (
          <div style={{ maxWidth: '520px' }}>
            <div style={{ background: 'rgba(241,196,15,0.08)', border: '1px solid rgba(241,196,15,0.25)', borderRadius: '16px', padding: '30px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '25px' }}>
                <div style={{ width: '50px', height: '50px', borderRadius: '50%', background: 'rgba(241,196,15,0.15)', border: '2px solid rgba(241,196,15,0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg width="24" height="24" viewBox="0 0 24 24" fill="none">
                    <path d="M12 2L3 7v5c0 5 3.8 9.7 9 11 5.2-1.3 9-6 9-11V7l-9-5z" stroke="#f1c40f" strokeWidth="1.8" strokeLinejoin="round"/>
                    <circle cx="12" cy="11" r="2" stroke="#f1c40f" strokeWidth="1.8"/>
                    <line x1="12" y1="13" x2="12" y2="16" stroke="#f1c40f" strokeWidth="1.8" strokeLinecap="round"/>
                  </svg>
                </div>
                <div>
                  <h3 style={{ margin: 0, color: '#f1c40f', fontSize: '1.1rem' }}>Información de Seguridad</h3>
                  <p style={{ margin: 0, color: 'var(--text-muted)', fontSize: '0.8rem' }}>Protección de tu cuenta de acceso</p>
                </div>
              </div>

              {!editandoSeguridad && usuario.preguntaSeguridad ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                  <div style={{ background: 'rgba(28, 40, 51, 0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', borderRadius: '10px', padding: '15px' }}>
                    <p style={{ margin: '0 0 4px 0', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Usuario de Acceso</p>
                    <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.1rem', fontWeight: 600 }}>👤 {usuario.usuario}</p>
                  </div>
                  <div style={{ background: 'rgba(28, 40, 51, 0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', borderRadius: '10px', padding: '15px' }}>
                    <p style={{ margin: '0 0 4px 0', color: 'var(--text-muted)', fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Pregunta de Seguridad</p>
                    <p style={{ margin: 0, color: '#f1c40f', fontSize: '0.95rem' }}>🔐 {usuario.preguntaSeguridad}</p>
                  </div>
                  <button onClick={() => setEditandoSeguridad(true)} style={{ background: 'transparent', border: '1.5px solid rgba(241,196,15,0.5)', color: '#f1c40f', padding: '10px', borderRadius: '10px', cursor: 'pointer', fontWeight: 'bold', marginTop: '10px' }}>
                    ⚙️ CAMBIAR CONFIGURACIÓN
                  </button>
                </div>
              ) : (
                <form onSubmit={handleGuardarSeguridad} style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label style={{ color: '#aaa', fontSize: '0.8rem' }}>TU USUARIO ACTUAL</label>
                    <input type="text" value={usuario.usuario} disabled style={{ opacity: 0.6 }} />
                  </div>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label style={{ color: '#aaa', fontSize: '0.8rem' }}>PREGUNTA DE SEGURIDAD</label>
                    <select value={preguntaTmp} onChange={(e) => setPreguntaTmp(e.target.value)} style={{ width: '100%', padding: '12px', background: 'rgba(28, 40, 51, 0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', color: 'var(--text-main)', border: '1.5px solid rgba(255,255,255,0.1)', borderRadius: '10px' }}>
                      <option>¿Cuál es el nombre de tu primera mascota?</option>
                      <option>¿En qué ciudad naciste?</option>
                      <option>¿Cuál es el apellido de tu madre?</option>
                      <option>¿Cuál fue el nombre de tu primera escuela?</option>
                      <option>¿Cuál es tu color favorito?</option>
                    </select>
                  </div>
                  <div className="input-group" style={{ margin: 0 }}>
                    <label style={{ color: '#aaa', fontSize: '0.8rem' }}>TU RESPUESTA SECRETA</label>
                    <input type="text" value={respuestaTmp} onChange={(e) => setRespuestaTmp(e.target.value)} placeholder="Ej: Toby / Caracas / Perez..." required />
                  </div>
                  <div style={{ display: 'flex', gap: '10px' }}>
                    <button type="submit" className="btn-login" style={{ background: 'linear-gradient(135deg, #f1c40f, #f39c12)', color: '#000', flex: 1 }} disabled={guardandoSeg}>
                      {guardandoSeg ? 'GUARDANDO...' : '✅ GUARDAR SEGURIDAD'}
                    </button>
                    {usuario.preguntaSeguridad && (
                      <button type="button" onClick={() => setEditandoSeguridad(false)} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', color: 'var(--text-main)', padding: '0 15px', borderRadius: '12px', cursor: 'pointer' }}>
                        CANCELAR
                      </button>
                    )}
                  </div>
                </form>
              )}
            </div>
          </div>
        )}
      </main>
    </div>
  );
}

export default Pasajero;
