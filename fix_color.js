const fs = require('fs');
const file = 'src/components/Admin.js';
let content = fs.readFileSync(file, 'utf8');

const start = content.indexOf("tab === 'registro'");
const end = content.indexOf("tab === 'usuarios'");

if (start !== -1 && end !== -1) {
  const part = content.slice(start, end);
  // Reemplazar color: 'var(--text-main)' y color: 'var(--text-muted)' por blanco o gris claro
  // para que sean legibles en el fondo oscuro
  let fixedPart = part.replace(/color:\s*'var\(--text-main\)'/g, "color: '#ffffff'");
  
  content = content.slice(0, start) + fixedPart + content.slice(end);
  fs.writeFileSync(file, content);
  console.log('Fixed');
} else {
  console.log('No se encontraron las secciones');
}
