const fs = require('fs');
const file = 'src/components/Admin.js';
let content = fs.readFileSync(file, 'utf8');

// Replace literal "\n" with a real newline
content = content.replace(/\\n\s+<span style/g, '\n                      <span style');

fs.writeFileSync(file, content);
console.log('Fixed literal backslash n');
