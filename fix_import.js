const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'components');
const files = ['Admin.js', 'Chofer.js', 'Fiscal.js', 'Pasajero.js'];

files.forEach(file => {
  const filePath = path.join(srcDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Import ThemeToggle if not present
  if (!content.includes('import ThemeToggle')) {
    content = content.replace(/^import React.*$/m, `$&
import ThemeToggle from './ThemeToggle';`);
  }

  fs.writeFileSync(filePath, content);
  console.log(`Updated import in ${file}`);
});
