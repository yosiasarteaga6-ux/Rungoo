const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'components');
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.js'));

const replaceColors = (content) => {
  // Replace inline greens with blues
  content = content.replace(/#2ecc71/g, '#3b82f6');
  content = content.replace(/#27ae60/g, '#2563eb');
  content = content.replace(/rgba\(46,\s*204,\s*113/g, 'rgba(59, 130, 246');
  
  // Replace typical card backgrounds with className="glass-card" and remove inline background
  // Example: <div style={{ background: 'rgba(0,0,0,0.2)', padding: '20px', borderRadius: '12px' }}>
  // We don't want to break the JSX. So let's just do targeted replacements if it's too complex.
  
  // Replace some dark translucent backgrounds with the glassmorphism color instead of class, to be safe.
  // We can just replace the rgba values with the new glassCardBg: rgba(28, 40, 51, 0.45)
  content = content.replace(/'rgba\(0,0,0,0\.2\)'/g, "'rgba(28, 40, 51, 0.45)'");
  content = content.replace(/'rgba\(0,\s*0,\s*0,\s*0\.2\)'/g, "'rgba(28, 40, 51, 0.45)'");
  content = content.replace(/'rgba\(0,\s*0,\s*0,\s*0\.25\)'/g, "'rgba(28, 40, 51, 0.45)'");
  content = content.replace(/'rgba\(0,\s*0,\s*0,\s*0\.3\)'/g, "'rgba(28, 40, 51, 0.45)'");
  content = content.replace(/'rgba\(0,\s*0,\s*0,\s*0\.35\)'/g, "'rgba(28, 40, 51, 0.45)'");
  content = content.replace(/'rgba\(0,\s*0,\s*0,\s*0\.4\)'/g, "'rgba(28, 40, 51, 0.45)'");
  content = content.replace(/'rgba\(30, 40, 50, 0\.4\)'/g, "'rgba(28, 40, 51, 0.45)'");

  // add backdrop filter and borders to the inline styles if missing
  // Actually, replacing background isn't enough for glassmorphism. It needs backdrop-filter.
  // Instead of complex AST manipulation, let's just add backdropFilter to any style object that gets the glass background.
  content = content.replace(/background:\s*'rgba\(28, 40, 51, 0\.45\)'/g, "background: 'rgba(28, 40, 51, 0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)', boxShadow: '0 8px 32px rgba(0, 0, 0, 0.2)'");

  return content;
};

files.forEach(file => {
  const filePath = path.join(srcDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = replaceColors(content);
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Updated ${file}`);
  }
});
console.log('JS refactoring complete.');
