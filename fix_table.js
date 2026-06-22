const fs = require('fs');
const file = 'src/components/Admin.js';
let content = fs.readFileSync(file, 'utf8');

// Replace the hardcoded white color in the table header
content = content.replace(
  "color: i === 5 ? '#3b82f6' : 'rgba(255,255,255,0.7)'",
  "color: i === 5 ? '#3b82f6' : 'var(--text-muted)'"
);

// Also let's check if there are other similar issues in this table.
// The hover effect: 'rgba(59, 130, 246,0.06)' - This is fine in both modes since it's translucent blue.
// The alternating row color: 'rgba(255,255,255,0.02)' - In light mode this is basically invisible. Maybe 'var(--input-bg)'? Let's leave it as is unless it's a problem, the user specifically mentioned "esta parte en modo claro no se ve" which means the text.

fs.writeFileSync(file, content);
console.log('Fixed table header color');
