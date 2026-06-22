const fs = require('fs');
const lines = fs.readFileSync('src/components/Admin.js', 'utf8').split('\n');
lines.forEach((l, i) => {
  if (l.includes('padding') && (l.includes("borderRadius: '16px'") || l.includes("borderRadius: '14px'"))) {
    console.log(i + 1, l.trim());
  }
});
