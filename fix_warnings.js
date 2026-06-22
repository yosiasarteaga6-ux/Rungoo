const fs = require('fs');
const path = require('path');

const files = [
  'Admin.js', 'Chofer.js', 'Fiscal.js', 'Pasajero.js', 'CompletarPerfil.js', 'RecuperarClave.js'
];

files.forEach(file => {
  const filePath = path.join(__dirname, 'src', 'components', file);
  if (!fs.existsSync(filePath)) return;
  
  let content = fs.readFileSync(filePath, 'utf8');
  let lines = content.split('\n');
  let changed = false;

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i];
    
    // Check for duplicate border
    let numBorders = (line.match(/border:/g) || []).length;
    while (numBorders > 1) {
      line = line.replace(/border:\s*['"`][^'"`]+['"`]\s*,?\s*(?=.*border:)/, '');
      numBorders = (line.match(/border:/g) || []).length;
      changed = true;
    }
    
    // Check for duplicate boxShadow
    let numBoxShadows = (line.match(/boxShadow:/g) || []).length;
    while (numBoxShadows > 1) {
      line = line.replace(/boxShadow:\s*['"`][^'"`]+['"`]\s*,?\s*(?=.*boxShadow:)/, '');
      numBoxShadows = (line.match(/boxShadow:/g) || []).length;
      changed = true;
    }

    lines[i] = line;
  }
  
  // Fix unused vars in Pasajero.js and RecuperarClave.js
  if (file === 'Pasajero.js') {
     for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('listaUnidades')) {
            lines[i] = lines[i].replace(/listaUnidades\s*,\s*/g, '');
            lines[i] = lines[i].replace(/,\s*listaUnidades/g, '');
            changed = true;
        }
     }
  }

  if (file === 'RecuperarClave.js') {
     for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes('const PREGUNTAS =')) {
            lines[i] = '// ' + lines[i];
            changed = true;
        }
     }
  }

  if (changed) {
    fs.writeFileSync(filePath, lines.join('\n'));
    console.log(`Fixed ${file}`);
  }
});
