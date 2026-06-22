const fs = require('fs');
const lines = fs.readFileSync('src/components/Admin.js', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes("tab === 'usuarios'") || l.includes("tab === 'unidades'")) {
    console.log(i + 1, l.trim());
  }
});
