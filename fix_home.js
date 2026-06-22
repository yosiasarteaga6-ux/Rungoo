const fs = require('fs');
const file = 'src/components/Admin.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  "{ label: 'Total Llegadas Hoy', value: listaLlegadas.length, bg: '#7b1c1c', icon: '🚌' }",
  "{ label: 'Total Llegadas Hoy', value: listaLlegadas.length, bg: 'rgba(239, 68, 68, 0.15)', icon: '🚌' }"
);

content = content.replace(
  "{ label: 'Unidades Registradas Act.', value: listaUnidades.length, bg: '#6b5108', icon: '🗂️' }",
  "{ label: 'Unidades Registradas Act.', value: listaUnidades.length, bg: 'rgba(245, 158, 11, 0.15)', icon: '🗂️' }"
);

content = content.replace(
  "{ label: 'Operativas', value: listaUnidades.filter(u => u.estado === 'Operativa').length, bg: '#0e4b2a', icon: '✔️' }",
  "{ label: 'Operativas', value: listaUnidades.filter(u => u.estado === 'Operativa').length, bg: 'rgba(16, 185, 129, 0.15)', icon: '✅' }"
);

content = content.replace(
  "{ label: 'Paradas Activas', value: 3, bg: '#0b3d20', icon: '📍' }",
  "{ label: 'Paradas Activas', value: 3, bg: 'rgba(139, 92, 246, 0.15)', icon: '📍' }"
);

content = content.replace(
  "boxShadow: '0 6px 24px rgba(0,0,0,0.4)'",
  "boxShadow: '0 4px 15px rgba(0,0,0,0.05)', border: '1px solid var(--card-border)'"
);

fs.writeFileSync(file, content);
console.log('Fixed colors');
