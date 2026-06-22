const fs = require('fs');
const file = 'src/components/Admin.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Registrar Personal
content = content.replace(
  "<div style={{ background: 'var(--card-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', borderRadius: '16px', padding: '35px', border: '1px solid var(--card-border)', boxShadow: '0 10px 30px rgba(0,0,0,0.3)' }}>",
  "<div className=\"neon-panel\" style={{ padding: '35px' }}>"
);

// 2. Expediente No results
content = content.replace(
  "<div style={{ background: 'var(--card-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid var(--card-border)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', padding: '30px', textAlign: 'center', borderRadius: '16px', color: 'var(--text-muted)' }}>",
  "<div className=\"neon-panel\" style={{ padding: '30px', textAlign: 'center', color: 'var(--text-muted)' }}>"
);

// 3. Unidades (3 instances)
content = content.replace(
  /<div style=\{\{ background: 'var\(--input-bg\)', borderRadius: '16px', padding: '20px', border: '1px solid var\(--card-border\)' \}\}>/g,
  "<div className=\"neon-panel\" style={{ padding: '20px' }}>"
);

// 4. Reportes table wrapper
content = content.replace(
  "<div style={{ background: 'var(--card-bg)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)', borderRadius: '16px', overflow: 'hidden', border: '1px solid rgba(59, 130, 246,0.15)' }}>",
  "<div className=\"neon-panel\" style={{ overflow: 'hidden' }}>"
);

// 5. Modals (Add Unidad, etc) - 2 instances
content = content.replace(
  /<div style=\{\{ background: 'linear-gradient\(135deg, #1e293b, #0f172a\)', border: '1px solid var\(--card-border\)', borderRadius: '24px', padding: '40px', width: '90%', maxWidth: '500px', boxShadow: '0 25px 50px rgba\(0,0,0,0\.5\)', position: 'relative', animation: 'cardEntrance 0\.4s cubic-bezier\(0\.16, 1, 0\.3, 1\)' \}\}>/g,
  "<div className=\"neon-panel\" style={{ padding: '40px', width: '90%', maxWidth: '500px', position: 'relative', animation: 'cardEntrance 0.4s cubic-bezier(0.16, 1, 0.3, 1)' }}>"
);

fs.writeFileSync(file, content);
console.log('Replaced panels successfully');
