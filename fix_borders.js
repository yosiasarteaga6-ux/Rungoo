const fs = require('fs');
const file = 'src/components/Admin.js';
let content = fs.readFileSync(file, 'utf8');

// Replace hardcoded white translucent borders with var(--card-border)
content = content.replace(/rgba\(255,255,255,0\.05\)/g, "var(--card-border)");
content = content.replace(/rgba\(255,\s*255,\s*255,\s*0\.1\)/g, "var(--card-border)");
content = content.replace(/rgba\(255,255,255,0\.15\)/g, "var(--card-border)");
// Keep rgba(255,255,255,0.08) just in case, but let's replace it too if it's used for border
content = content.replace(/borderColor = 'rgba\(255,255,255,0\.08\)'/g, "borderColor = 'var(--card-border)'");
content = content.replace(/border: '1px solid rgba\(255,255,255,0\.08\)'/g, "border: '1px solid var(--card-border)'");

fs.writeFileSync(file, content);
console.log('Fixed borders to use var(--card-border)');
