const fs = require('fs');
const file = 'src/components/Admin.js';
let content = fs.readFileSync(file, 'utf8');

// 1. Reportes Cards (Line ~1302)
content = content.replace(
  "<div key={i} style={{ background: stat.bg, borderRadius: '16px', padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px', boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid var(--card-border)' }}>",
  "<div key={i} className=\"neon-panel\" style={{ background: stat.bg, padding: '28px 20px', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '10px' }}>"
);

// 2. Parada Calderas (Line ~1137)
content = content.replace(
  "<div style={{ background: '#112d1a', borderRadius: '24px', padding: '28px', border: '1px solid rgba(59, 130, 246,0.2)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>",
  "<div className=\"neon-panel\" style={{ background: 'rgba(17, 45, 26, 0.4)', padding: '28px', display: 'flex', flexDirection: 'column' }}>"
);

// 3. Parada San Antonio (Line ~1168)
content = content.replace(
  "<div style={{ background: '#2a2108', borderRadius: '24px', padding: '28px', border: '1px solid rgba(241,196,15,0.2)', boxShadow: '0 10px 30px rgba(0,0,0,0.5)', display: 'flex', flexDirection: 'column' }}>",
  "<div className=\"neon-panel\" style={{ background: 'rgba(42, 33, 8, 0.4)', padding: '28px', display: 'flex', flexDirection: 'column' }}>"
);

fs.writeFileSync(file, content);
console.log('Applied neon-panel to Reportes and Paradas cards');
