const fs = require('fs');
const file = 'src/components/Admin.js';
let content = fs.readFileSync(file, 'utf8');

// Total Unidades - remove duplicate
content = content.replace(/<span style=\{\{ color: 'var\(--text-muted\)', fontSize: '1\.5rem', fontWeight: 'bold' \}\}>\{totalUnidades\}<\/span>/, '');

// Operativas - replace {operativas} with ✅
content = content.replace(/<span style=\{\{ color: 'rgba\(59, 130, 246,0\.3\)', fontSize: '1\.5rem', fontWeight: 'bold' \}\}>\{operativas\}<\/span>/, "<span style={{ color: 'rgba(59, 130, 246,0.5)', fontSize: '1.5rem', fontWeight: 'bold' }}>✅</span>");

// Inactivas - add 🛑 next to it
// Wait, inactivas currently doesn't have a second span.
content = content.replace(/<span style=\{\{ color: '#e74c3c', fontSize: '2rem', fontWeight: 'bold' \}\}>\{inactivas\}<\/span>/, "<span style={{ color: '#e74c3c', fontSize: '2rem', fontWeight: 'bold' }}>{inactivas}</span>\\n                      <span style={{ fontSize: '1.5rem' }}>🛑</span>");

fs.writeFileSync(file, content);
console.log('Replaced correctly');
