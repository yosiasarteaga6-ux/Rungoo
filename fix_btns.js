const fs = require('fs');
const file = 'src/components/Admin.js';
let content = fs.readFileSync(file, 'utf8');

content = content.replace(/'rgba\(28,\s*40,\s*51,\s*0\.45\)'/g, "'var(--card-bg)'");
content = content.replace(/:\s*'rgba\(255,255,255,0\.6\)'/g, ": 'var(--text-muted)'");

fs.writeFileSync(file, content);
console.log('Fixed button backgrounds');
