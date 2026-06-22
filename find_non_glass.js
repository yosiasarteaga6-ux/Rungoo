const fs = require('fs');
const lines = fs.readFileSync('src/components/Admin.js', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes('border: \'1px solid var(--card-border)\'') && !l.includes('backdropFilter') && l.includes('padding:')) {
    console.log(i + 1, l.trim());
  }
});
