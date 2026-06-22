const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'Admin.js');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('{/* ── Encabezado de bienvenida ── */}')) {
    startIndex = i;
  }
  if (lines[i].includes('{/* ── Actividad Reciente ── */}')) {
    endIndex = i;
  }
  if (lines[i].includes('Actividad Reciente') && lines[i].includes('<h3')) {
    // alternative end boundary if comment is missing
    if (endIndex === -1) {
      endIndex = i - 3; // roughly where the div starts
    }
  }
}

if (startIndex === -1 || endIndex === -1) {
  console.log("Could not find boundaries", startIndex, endIndex);
  process.exit(1);
}

const before = lines.slice(0, startIndex);
const after = lines.slice(endIndex);

const newHeader = `            {/* ── Encabezado de bienvenida ── */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--neon-header-bg)', border: \`1px solid var(--neon-header-border)\`, borderRadius: '16px', padding: '24px 30px', marginBottom: '32px', boxShadow: '0 10px 30px rgba(0,0,0,0.05)' }}>
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

              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px', position: 'relative', zIndex: 1 }}>

                {/* Tarjeta 1: Unidades Activas */}
                <div
                  onClick={() => setTab('unidades')}
                  style={{
                    background: 'var(--neon-card-bg)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid var(--neon-card-border)',
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
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--neon-icon-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s' }}>
                      <Bus size={20} color="var(--neon-icon-color)" />
                    </div>
                  </div>
                  <div style={{ color: 'var(--neon-text-num)', fontSize: '2.8rem', fontWeight: 800, lineHeight: 1, display: 'flex', alignItems: 'baseline', gap: '8px', transition: 'color 0.3s' }}>
                    {loadingHome ? '–' : homeStats.unidadesActivas} 
                    <span style={{ fontSize: '1.4rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ {homeStats.unidadesTotal}</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', margin: '14px 0 0 0', fontSize: '0.8rem' }}>Operativas en la ruta</p>
                  
                  {/* Barra de progreso */}
                  <div style={{ marginTop: '16px', height: '4px', background: 'var(--neon-progress-track)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: \`\${homeStats.unidadesTotal > 0 ? (homeStats.unidadesActivas / homeStats.unidadesTotal) * 100 : 0}%\`, background: 'var(--neon-progress-fill)', borderRadius: '2px', boxShadow: '0 0 10px var(--neon-progress-fill)', transition: 'width 0.8s ease, background 0.3s' }} />
                  </div>
                </div>

                {/* Tarjeta 2: Personal en Turno */}
                <div
                  onClick={() => setTab('usuarios')}
                  style={{
                    background: 'var(--neon-card-bg)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid var(--neon-card-border)',
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
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--neon-icon-bg)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s' }}>
                      <Users size={20} color="var(--neon-icon-color)" />
                    </div>
                  </div>
                  <div style={{ color: 'var(--neon-text-num)', fontSize: '2.8rem', fontWeight: 800, lineHeight: 1, display: 'flex', alignItems: 'baseline', gap: '8px', transition: 'color 0.3s' }}>
                    {loadingHome ? '–' : homeStats.personalTurno} 
                    <span style={{ fontSize: '1.4rem', fontWeight: 500, color: 'var(--text-muted)' }}>/ {homeStats.personalTotal}</span>
                  </div>
                  <p style={{ color: 'var(--text-muted)', margin: '14px 0 0 0', fontSize: '0.8rem' }}>Choferes y fiscales activos</p>
                  
                  {/* Barra de progreso */}
                  <div style={{ marginTop: '16px', height: '4px', background: 'var(--neon-progress-track)', borderRadius: '2px', overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: \`\${homeStats.personalTotal > 0 ? (homeStats.personalTurno / homeStats.personalTotal) * 100 : 0}%\`, background: 'var(--neon-progress-fill)', borderRadius: '2px', boxShadow: '0 0 10px var(--neon-progress-fill)', transition: 'width 0.8s ease, background 0.3s' }} />
                  </div>
                </div>

                {/* Tarjeta 3: Incidencias Activas */}
                <div
                  onClick={() => setTab('incidencias')}
                  style={{
                    background: 'var(--neon-card-bg)',
                    backdropFilter: 'blur(16px)',
                    border: '1px solid var(--neon-card-border-alert)',
                    borderRadius: '16px', padding: '24px',
                    cursor: 'pointer', position: 'relative', overflow: 'hidden',
                    boxShadow: 'var(--neon-shadow-alert)',
                    transition: 'all 0.3s ease'
                  }}
                  onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-4px)'; e.currentTarget.style.boxShadow = '0 12px 40px rgba(0,0,0,0.15), var(--neon-shadow-alert)'; }}
                  onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = 'var(--neon-shadow-alert)'; }}
                >
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                    <p style={{ color: 'var(--text-main)', margin: '0', fontSize: '0.85rem', fontWeight: 700, letterSpacing: '0.5px' }}>INCIDENCIAS ACTIVAS</p>
                    <div style={{ width: '38px', height: '38px', borderRadius: '10px', background: 'var(--neon-icon-bg-alert)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.3s' }}>
                      <AlertTriangle size={20} color="var(--neon-icon-color-alert)" />
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
                    <div style={{ height: '100%', width: homeStats.incidenciasPendientes > 0 ? '100%' : '0%', background: 'var(--neon-progress-fill-alert)', borderRadius: '2px', boxShadow: '0 0 10px var(--neon-progress-fill-alert)', transition: 'width 0.8s ease, background 0.3s' }} />
                  </div>
                </div>

              </div>
            </div>
`;

// Find where to insert, there's a div holding Actividad Reciente. 
// We should find the exact line 
let i = endIndex;
while(i > 0 && !lines[i].includes('<div') && !lines[i].includes('Actividad Reciente')) {
  i--;
}
// Let's just use the strict bounds we found.
const newContent = [...before, newHeader, ...lines.slice(endIndex - 8 > startIndex ? endIndex - 8 : endIndex)].join('\n');
// Wait, my strict bounds might miss closing divs. Let's make it simpler:

// Clean approach: find exactly the block to replace.
// Let's use regex on the whole file string.
let fullContent = fs.readFileSync(filePath, 'utf8');

// Replace from {/* ── Encabezado de bienvenida ── */} up to the closing div of the grid.
const startPattern = /\{\/\*\s*──\s*Encabezado de bienvenida\s*──\s*\*\/\}/;
// Instead of regex, let's just splice lines.
const lines2 = fs.readFileSync(filePath, 'utf8').split('\n');
let s = -1;
let e = -1;
for (let j=0; j<lines2.length; j++) {
  if (lines2[j].includes('{/* ── Encabezado de bienvenida ── */}')) s = j;
  if (lines2[j].includes('Actividad Reciente') && lines2[j].includes('h3')) e = j;
}
if (s !== -1 && e !== -1) {
  // Find the div wrapper of Actividad Reciente
  while (e > s && !lines2[e].includes('<div style={{')) e--;
  const finalBefore = lines2.slice(0, s);
  const finalAfter = lines2.slice(e);
  fs.writeFileSync(filePath, [...finalBefore, newHeader, ...finalAfter].join('\n'));
  console.log('Successfully applied dynamic neon variables.');
} else {
  console.log('Failed to find exact boundaries via regex approach.');
}

