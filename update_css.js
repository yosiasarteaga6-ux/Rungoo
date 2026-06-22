const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'App.css');
let css = fs.readFileSync(cssPath, 'utf8');

// Replace greens with blues
css = css.replace(/#2ecc71/g, '#3b82f6'); // verde a azul principal
css = css.replace(/#27ae60/g, '#2563eb'); // verde oscuro a azul oscuro
css = css.replace(/#0a1628/g, '#0a192f'); // fondo base a azul marino profundo

// rgba(46, 204, 113, x) -> rgba(59, 130, 246, x)
css = css.replace(/46,\s*204,\s*113/g, '59, 130, 246');
css = css.replace(/39,\s*174,\s*96/g, '37, 99, 235');

// Add the new .glass-card classes
const glassCardCss = `
/* ========================================================
   GLASSMORPHISM CLASSES
   ======================================================== */
.glass-card {
  background: rgba(28, 40, 51, 0.45);
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid rgba(255, 255, 255, 0.1);
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.2);
  border-radius: 16px;
}

.light-mode .glass-card {
  background: rgba(255, 255, 255, 0.6);
  border: 1px solid rgba(255, 255, 255, 0.2);
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.15);
}

.dashboard-container {
  background: #0a192f;
}
`;

css += '\n' + glassCardCss;

fs.writeFileSync(cssPath, css);
console.log('App.css updated successfully.');
