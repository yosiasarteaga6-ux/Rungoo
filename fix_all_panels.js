const fs = require('fs');
const file = 'src/components/Admin.js';
let lines = fs.readFileSync(file, 'utf8').split('\n');

let currentTab = null;

for (let i = 0; i < lines.length; i++) {
  // Track which tab we are rendering
  if (lines[i].includes("tab === 'usuarios' &&")) currentTab = 'usuarios';
  if (lines[i].includes("tab === 'unidades' &&")) currentTab = 'unidades';
  if (lines[i].includes("tab === 'incidencias' &&")) currentTab = 'incidencias';
  if (lines[i].includes("tab === 'registro' &&")) currentTab = 'registro';
  if (lines[i].includes("tab === 'home' &&")) currentTab = 'home';
  if (lines[i].includes("tab === 'paradas' &&")) currentTab = 'paradas';
  if (lines[i].includes("tab === 'reporte' &&")) currentTab = 'reporte';

  // If we are in the usuarios, unidades, or incidencias tabs
  // These tabs have hardcoded dark rgba backgrounds for their cards and inputs.
  if (currentTab === 'usuarios' || currentTab === 'unidades' || currentTab === 'incidencias') {
    lines[i] = lines[i].replace(/color:\s*'var\(--text-main\)'/g, "color: '#ffffff'");
    lines[i] = lines[i].replace(/color:\s*'var\(--text-muted\)'/g, "color: 'rgba(255,255,255,0.7)'");
    
    // Some lines use template literals for color, or they use className.
  }
}

fs.writeFileSync(file, lines.join('\n'));
console.log('Fixed panels colors safely');
