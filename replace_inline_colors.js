const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src', 'components');
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.js'));

const replaceColors = (content) => {
  content = content.replace(/color:\s*'#fff'/g, "color: 'var(--text-main)'");
  content = content.replace(/color:\s*'#ffffff'/gi, "color: 'var(--text-main)'");
  content = content.replace(/color:\s*'white'/gi, "color: 'var(--text-main)'");
  // Replace rgba white with muted text
  content = content.replace(/color:\s*'rgba\(255,\s*255,\s*255,\s*0\.\d+\)'/g, "color: 'var(--text-muted)'");
  return content;
};

files.forEach(file => {
  const filePath = path.join(srcDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let newContent = replaceColors(content);
  if (content !== newContent) {
    fs.writeFileSync(filePath, newContent);
    console.log(`Updated inline colors in ${file}`);
  }
});
console.log('Inline colors replaced.');
