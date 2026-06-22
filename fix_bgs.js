const fs = require('fs');
const file = 'src/components/Admin.js';
let content = fs.readFileSync(file, 'utf8');

// Restore text colors that I incorrectly forced to white
content = content.replace(/color:\s*'#ffffff'/g, "color: 'var(--text-main)'");
content = content.replace(/color:\s*'rgba\(255,255,255,0\.7\)'/g, "color: 'var(--text-muted)'");

// Replace hardcoded dark backgrounds with theme variables
content = content.replace(/background:\s*'rgba\(28, 40, 51, 0\.45\)'/g, "background: 'var(--card-bg)'");
content = content.replace(/background:\s*'rgba\(30,40,50,0\.6\)'/g, "background: 'var(--input-bg)'");
content = content.replace(/background:\s*'rgba\(30,40,50,0\.4\)'/g, "background: 'var(--card-bg)'");

// Some list items have hover effects that use hardcoded colors
content = content.replace(/background = 'rgba\(255,255,255,0\.08\)'/g, "background = 'var(--card-bg)'");
content = content.replace(/background = 'rgba\(30,40,50,0\.4\)'/g, "background = 'var(--card-bg)'");

// Write back
fs.writeFileSync(file, content);
console.log('Fixed backgrounds to use theme variables!');
