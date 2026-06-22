const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'components', 'Admin.js');
let lines = fs.readFileSync(filePath, 'utf8').split('\n');

let startIndex = -1;
let endIndex = -1;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes('tab === \'home\' && (')) {
    // Only the first one inside main-content
    if (i > 500 && startIndex === -1) {
      startIndex = i;
    }
  }
  if (lines[i].includes('{/* ── Sección: Tablero de Control ── */}')) {
    if (i > 500 && endIndex === -1) {
      endIndex = i;
    }
  }
}

if (startIndex !== -1 && endIndex !== -1) {
  const before = lines.slice(0, startIndex + 1);
  const after = lines.slice(endIndex);

  const newHeader = `          <div className="fade-in-tab">

            {/* ── Encabezado de bienvenida ── */}
            <div style={{
              background: 'rgba(255,255,255,0.03)',
              border: '1px solid rgba(243,156,18,0.25)',
              borderRadius: '18px',
              padding: '22px 26px',
              marginBottom: '24px',
              display: 'flex',
              alignItems: 'center',
              gap: '18px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.35)'
            }}>
              <div style={{
                width: '58px', height: '58px', borderRadius: '50%',
                background: 'linear-gradient(135deg, #f39c12, #e67e22)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '1.7rem', fontWeight: 900, color: '#fff',
                flexShrink: 0, boxShadow: '0 4px 18px rgba(243,156,18,0.4)'
              }}>
                {(usuario.nombre || 'A').charAt(0).toUpperCase()}
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ color: 'var(--text-muted)', margin: '0 0 3px 0', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '2px', fontWeight: 600 }}>Panel Administrativo</p>
                <h2 style={{ color: 'var(--text-main)', margin: '0 0 3px 0', fontSize: '1.45rem', fontWeight: 900, lineHeight: 1.2 }}>
                  Hola, <span style={{ color: '#f39c12' }}>{usuario.nombre || 'Administrador Principal'}</span> 👋
                </h2>
                <p style={{ color: 'var(--text-muted)', margin: 0, fontSize: '0.78rem' }}>Ruta Express · Las Calderas · Control Central</p>
              </div>
              <button
                onClick={fetchHomeStats}
                disabled={loadingHome}
                style={{
                  background: 'linear-gradient(135deg, #3b82f6, #2563eb)', border: 'none',
                  color: '#fff', borderRadius: '10px', padding: '10px 18px',
                  cursor: 'pointer', fontSize: '0.85rem', fontWeight: 600, transition: 'all 0.2s',
                  display: 'flex', alignItems: 'center', gap: '8px', boxShadow: '0 4px 15px rgba(59,130,246,0.4)',
                  marginLeft: 'auto'
                }}
                onMouseEnter={e => { e.currentTarget.style.transform = 'translateY(-2px)'; e.currentTarget.style.boxShadow = '0 6px 20px rgba(59,130,246,0.6)'; }}
                onMouseLeave={e => { e.currentTarget.style.transform = 'translateY(0)'; e.currentTarget.style.boxShadow = '0 4px 15px rgba(59,130,246,0.4)'; }}
              >
                {loadingHome ? '⏳' : '🔄'} Actualizar
              </button>
            </div>
`;

  const newContent = [...before, newHeader, ...after].join('\n');
  fs.writeFileSync(filePath, newContent);
  console.log('Fixed header corruption. Indices were', startIndex, endIndex);
} else {
  console.error('Could not find boundaries.', startIndex, endIndex);
}
