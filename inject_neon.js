const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'Admin.js');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

const before = lines.slice(0, 594);
const after = lines.slice(682);

const replacement = `            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '16px', padding: '24px 30px', marginBottom: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
              <h1 style={{ margin: 0, fontSize: '1.6rem', fontWeight: 600, color: 'var(--text-main)', letterSpacing: '1px' }}>
                HOLA, ADMINISTRADOR PRINCIPAL
              </h1>
              <button
                onClick={fetchHomeStats}
                disabled={loadingHome}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none',
                  color: '#fff', borderRadius: '10px', padding: '10px 18px',
                  cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(59,130,246,0.4)'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(59,130,246,0.6)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(59,130,246,0.4)'; }}
              >
                {loadingHome ? '⏳' : '🔄'} Actualizar
              </button>
            </div>

            {/* ── Sección: Tablero de Control ── */}
            <p style={{ color: 'var(--text-muted)', fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2.5px', margin: '0 0 14px 4px' }}>Tablero de Control de Ruta</p>

            {/* ── Tarjetas de KPIs ── */}
            <div style={{ position: 'relative', marginBottom: '36px' }}>
              
              {/* Background Glow Blobs */}
              <div style={{ position: 'absolute', top: '-20%', left: '5%', width: '40%', height: '140%', background: 'rgba(56, 189, 248, 0.15)', filter: 'blur(60px)', zIndex: 0, borderRadius: '50%', pointerEvents: 'none' }} />
              <div style={{ position: 'absolute', top: '-10%', right: '5%', width: '35%', height: '120%', background: 'rgba(248, 113, 113, 0.12)', filter: 'blur(60px)', zIndex: 0, borderRadius: '50%', pointerEvents: 'none' }} />

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', position: 'relative', zIndex: 1 }}>

                {/* Tarjeta 1: Unidades Activas */}
                <div
                  onClick={() => setTab('unidades')}
                  style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    borderRadius: '16px', padding: '24px',
                    cursor: 'pointer', position: 'relative', overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 15px rgba(56, 189, 248, 0.2), inset 0 0 20px rgba(56, 189, 248, 0.05)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4), 0 0 25px rgba(56, 189, 248, 0.4), inset 0 0 20px rgba(56, 189, 248, 0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3), 0 0 15px rgba(56, 189, 248, 0.2), inset 0 0 20px rgba(56, 189, 248, 0.05)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <p style={{ color: 'var(--text-main)', margin: '0', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.5px' }}>UNIDADES ACTIVAS</p>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Bus size={20} color="#38bdf8" />
                    </div>
                  </div>
                  <div style={{ color: 'var(--text-main)', fontSize: '2.8rem', fontWeight: 800, lineHeight: 1, display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    {loadingHome ? '–' : homeStats.unidadesActivas} 
                    <span style={{ fontSize: '1.4rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ {homeStats.unidadesTotal}</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', margin: '14px 0 0 0', fontSize: '0.8rem' }}>Operativas en la ruta</p>
                  
                  {/* Barra de progreso */}
                  <div style={{ marginTop: '16px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: \`\${homeStats.unidadesTotal > 0 ? (homeStats.unidadesActivas / homeStats.unidadesTotal) * 100 : 0}%\`, background: '#38bdf8', borderRadius: '2px', boxShadow: '0 0 10px #38bdf8', transition: 'width 0.8s ease' }} />
                  </div>
                </div>

                {/* Tarjeta 2: Personal en Turno */}
                <div
                  onClick={() => setTab('usuarios')}
                  style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    borderRadius: '16px', padding: '24px',
                    cursor: 'pointer', position: 'relative', overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 15px rgba(56, 189, 248, 0.2), inset 0 0 20px rgba(56, 189, 248, 0.05)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4), 0 0 25px rgba(56, 189, 248, 0.4), inset 0 0 20px rgba(56, 189, 248, 0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3), 0 0 15px rgba(56, 189, 248, 0.2), inset 0 0 20px rgba(56, 189, 248, 0.05)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <p style={{ color: 'var(--text-main)', margin: '0', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.5px' }}>PERSONAL EN TURNO</p>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <Users size={20} color="#cbd5e1" />
                    </div>
                  </div>
                  <div style={{ color: 'var(--text-main)', fontSize: '2.8rem', fontWeight: 800, lineHeight: 1, display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    {loadingHome ? '–' : homeStats.personalTurno} 
                    <span style={{ fontSize: '1.4rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ {homeStats.personalTotal}</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', margin: '14px 0 0 0', fontSize: '0.8rem' }}>Choferes y fiscales activos</p>
                  
                  {/* Barra de progreso */}
                  <div style={{ marginTop: '16px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: \`\${homeStats.personalTotal > 0 ? (homeStats.personalTurno / homeStats.personalTotal) * 100 : 0}%\`, background: '#fff', borderRadius: '2px', boxShadow: '0 0 8px rgba(255,255,255,0.8)', transition: 'width 0.8s ease' }} />
                  </div>
                </div>

                {/* Tarjeta 3: Incidencias Activas */}
                <div
                  onClick={() => setTab('incidencias')}
                  style={{
                    background: 'rgba(15, 23, 42, 0.65)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid rgba(248, 113, 113, 0.4)',
                    borderRadius: '16px', padding: '24px',
                    cursor: 'pointer', position: 'relative', overflow: 'hidden',
                    boxShadow: '0 8px 32px rgba(0,0,0,0.3), 0 0 15px rgba(248, 113, 113, 0.2), inset 0 0 20px rgba(248, 113, 113, 0.05)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.4), 0 0 25px rgba(248, 113, 113, 0.4), inset 0 0 20px rgba(248, 113, 113, 0.1)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 8px 32px rgba(0,0,0,0.3), 0 0 15px rgba(248, 113, 113, 0.2), inset 0 0 20px rgba(248, 113, 113, 0.05)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <p style={{ color: 'var(--text-main)', margin: '0', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.5px' }}>INCIDENCIAS ACTIVAS</p>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'rgba(248, 113, 113, 0.2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      <AlertTriangle size={20} color="#f87171" />
                    </div>
                  </div>
                  <div style={{ color: 'var(--text-main)', fontSize: '2.8rem', fontWeight: 800, lineHeight: 1, display: 'flex', alignItems: 'baseline', gap: '8px' }}>
                    {loadingHome ? '–' : homeStats.incidenciasPendientes} 
                    <span style={{ fontSize: '1.1rem', fontWeight: 600, color: 'var(--text-muted)', textTransform: 'uppercase' }}>Pendientes</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', margin: '14px 0 0 0', fontSize: '0.75rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {homeStats.incidenciasNombres.length > 0 ? homeStats.incidenciasNombres.join(', ') : 'Sin novedades activas'}
                  </p>
                  
                  {/* Barra de progreso */}
                  <div style={{ marginTop: '16px', height: '4px', background: 'rgba(255,255,255,0.1)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: homeStats.incidenciasPendientes > 0 ? '100%' : '0%', background: '#f87171', borderRadius: '2px', boxShadow: '0 0 10px #f87171', transition: 'width 0.8s ease' }} />
                  </div>
                </div>

              </div>
            </div>`;

const newContent = [...before, replacement, ...after].join('\n');
fs.writeFileSync(filePath, newContent);
console.log('Successfully injected neon glowing cards.');
