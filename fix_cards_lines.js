const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'Admin.js');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

// Delete lines 609 to 685 (0-indexed: 609 to 685)
// So we keep up to index 608.
const before = lines.slice(0, 609);
const after = lines.slice(686); // from 686 onwards (0-indexed, so line 687 onwards)

const replacement = `            {/* ── Sección: Tablero de Control ── */}
            <p style={{ color: 'var(--text-muted)', fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '2.5px', margin: '20px 0 14px 0' }}>Dashboard</p>

            {/* ── Tarjetas de KPIs ── */}
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
                <div style={{ color: 'var(--text-main)', fontSize: '2.4rem', fontWeight: 700, lineHeight: 1, marginTop: '5px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {loadingHome ? '–' : homeStats.incidenciasPendientes} {homeStats.incidenciasPendientes > 0 && <span style={{fontSize: '1rem', color: '#e74c3c'}}>⚠️</span>}
                </div>
              </div>
            </div>`;

const newContent = [...before, replacement, ...after].join('\n');
fs.writeFileSync(filePath, newContent);
console.log('Fixed cards based on line numbers.');
