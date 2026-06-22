const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'components');
const files = ['Admin.js', 'Chofer.js', 'Fiscal.js', 'Pasajero.js'];

files.forEach(file => {
  const filePath = path.join(srcDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  // Import ThemeToggle if not present
  if (!content.includes('import ThemeToggle')) {
    content = content.replace(/(import React.*?;\n)/, '$1import ThemeToggle from \'./ThemeToggle\';\n');
  }

  // Insert ThemeToggle before onLogout in sidebar
  if (!content.includes('<ThemeToggle')) {
    content = content.replace(/(<button[^>]*?onClick=\{onLogout\}[^>]*?>)/, '<ThemeToggle style={{ width: "100%", marginBottom: "10px", justifyContent: "center" }} />\n        $1');
  }

  fs.writeFileSync(filePath, content);
  console.log(`Updated ${file} with ThemeToggle`);
});
