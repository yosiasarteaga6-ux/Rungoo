const fs = require('fs');
const file = 'src/components/Admin.js';
let lines = fs.readFileSync(file, 'utf8').split('\n');

let inRegistro = false;
let braceCount = 0;

for (let i = 0; i < lines.length; i++) {
  if (lines[i].includes("tab === 'registro'") && lines[i].includes("&&")) {
    inRegistro = true;
  }
  
  if (inRegistro) {
    // Replace color: 'var(--text-main)' with color: '#ffffff'
    lines[i] = lines[i].replace(/color:\s*'var\(--text-main\)'/g, "color: '#ffffff'");
    
    // Also change var(--text-muted) to a lighter gray if it's there
    lines[i] = lines[i].replace(/color:\s*'var\(--text-muted\)'/g, "color: 'rgba(255,255,255,0.7)'");
    
    // Count braces to know when we exit the block
    const openBraces = (lines[i].match(/\{/g) || []).length;
    const closeBraces = (lines[i].match(/\}/g) || []).length;
    
    braceCount += openBraces - closeBraces;
    
    if (braceCount === 0 && lines[i].includes(')')) {
      inRegistro = false;
    }
  }
}

fs.writeFileSync(file, lines.join('\n'));
console.log('Colors fixed safely');
