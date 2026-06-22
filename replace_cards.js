const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'Admin.js');
let content = fs.readFileSync(filePath, 'utf8');

// We find the Tablero de Control de Ruta section and replace the cards
const startMarker = "            {/* ── Tarjetas de KPIs ── */}";
const endMarker = "            {/* ── Actividad Reciente ── */}";

const startIdx = content.indexOf(startMarker);
const endIdx = content.indexOf(endMarker);

if (startIdx !== -1 && endIdx !== -1) {
  const replacement = `            {/* ── Tarjetas de KPIs ── */}
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '28px' }}>

              {/* Tarjeta 1: Unidades Activas */}
              <div
                onClick={() => setTab('unidades')}
                className="glass-card"
                style={{
                  padding: '20px 18px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                  display: 'flex', flexDirection: 'column', gap: '8px'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ color: 'var(--text-main)', margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>Total vehicles active</p>
                  <Bus size={18} color="var(--primary-color)" />
                </div>
                <div style={{ color: 'var(--text-main)', fontSize: '2.4rem', fontWeight: 700, lineHeight: 1, marginTop: '5px' }}>
                  {loadingHome ? '–' : homeStats.unidadesActivas}
                </div>
              </div>

              {/* Tarjeta 2: Personal en Turno */}
              <div
                onClick={() => setTab('usuarios')}
                className="glass-card"
                style={{
                  padding: '20px 18px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                  display: 'flex', flexDirection: 'column', gap: '8px'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ color: 'var(--text-main)', margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>Current shifts</p>
                  <Users size={18} color="var(--primary-color)" />
                </div>
                <div style={{ color: 'var(--text-main)', fontSize: '2.4rem', fontWeight: 700, lineHeight: 1, marginTop: '5px' }}>
                  {loadingHome ? '–' : homeStats.personalTurno}
                </div>
              </div>

              {/* Tarjeta 3: Incidencias Activas */}
              <div
                onClick={() => setTab('incidencias')}
                className="glass-card"
                style={{
                  padding: '20px 18px',
                  cursor: 'pointer',
                  transition: 'transform 0.2s ease',
                  display: 'flex', flexDirection: 'column', gap: '8px'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-3px)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; }}
              >
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <p style={{ color: 'var(--text-main)', margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>Current alerts</p>
                  <AlertTriangle size={18} color="#e74c3c" />
                </div>
                <div style={{ color: 'var(--text-main)', fontSize: '2.4rem', fontWeight: 700, lineHeight: 1, marginTop: '5px' }}>
                  {loadingHome ? '–' : homeStats.incidenciasPendientes} <span style={{fontSize: '1rem', color: '#e74c3c'}}>⚠️</span>
                </div>
              </div>
            </div>

`;

  const newContent = content.substring(0, startIdx) + replacement + content.substring(endIdx);
  fs.writeFileSync(filePath, newContent);
  console.log('Cards replaced to match mockup exactly.');
} else {
  console.log('Markers not found');
}
