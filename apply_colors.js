const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'index.css');
const adminPath = path.join(__dirname, 'src', 'components', 'Admin.js');

let cssContent = fs.readFileSync(cssPath, 'utf8');
let adminContent = fs.readFileSync(adminPath, 'utf8');

// Update CSS Variables in Dark Mode
cssContent = cssContent.replace(
  /:root, \[data-theme="dark"\] \{[\s\S]*?(?=\/\* Dark Mode \(Default\))/,
  `:root, [data-theme="dark"] {
  --neon-card-bg: rgba(15, 23, 42, 0.65);
  --neon-header-bg: rgba(255,255,255,0.05);
  --neon-header-border: rgba(255,255,255,0.1);
  --neon-progress-track: rgba(255,255,255,0.1);
  --neon-text-num: var(--text-main);
  
  /* Green (Card 1) */
  --neon-card1-border: rgba(16, 185, 129, 0.4);
  --neon-card1-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 15px rgba(16, 185, 129, 0.2), inset 0 0 20px rgba(16, 185, 129, 0.05);
  --neon-icon1-bg: rgba(16, 185, 129, 0.2);
  --neon-icon1-color: #10b981;
  --neon-blob1: rgba(16, 185, 129, 0.15);
  
  /* Yellow (Card 2) */
  --neon-card2-border: rgba(245, 158, 11, 0.4);
  --neon-card2-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 15px rgba(245, 158, 11, 0.2), inset 0 0 20px rgba(245, 158, 11, 0.05);
  --neon-icon2-bg: rgba(245, 158, 11, 0.2);
  --neon-icon2-color: #f59e0b;
  --neon-blob2: rgba(245, 158, 11, 0.12);
  
  /* Red (Card 3) */
  --neon-card3-border: rgba(239, 68, 68, 0.4);
  --neon-card3-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 15px rgba(239, 68, 68, 0.2), inset 0 0 20px rgba(239, 68, 68, 0.05);
  --neon-icon3-bg: rgba(239, 68, 68, 0.2);
  --neon-icon3-color: #ef4444;
  --neon-blob3: rgba(239, 68, 68, 0.12);

`
);

// Update CSS Variables in Light Mode
cssContent = cssContent.replace(
  /\[data-theme="light"\] \{[\s\S]*?(?=--bg-color-light:)/,
  `[data-theme="light"] {
  --neon-card-bg: rgba(255, 255, 255, 0.85);
  --neon-header-bg: rgba(255,255,255,0.9);
  --neon-header-border: #E2E8F0;
  --neon-progress-track: rgba(0,0,0,0.1);
  --neon-text-num: #1E3A8A;
  
  /* Green (Card 1) */
  --neon-card1-border: rgba(16, 185, 129, 0.4);
  --neon-card1-shadow: 0 8px 32px rgba(16, 185, 129, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.5);
  --neon-icon1-bg: #10b981;
  --neon-icon1-color: #FFFFFF;
  --neon-blob1: rgba(16, 185, 129, 0.15);
  
  /* Yellow (Card 2) */
  --neon-card2-border: rgba(245, 158, 11, 0.4);
  --neon-card2-shadow: 0 8px 32px rgba(245, 158, 11, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.5);
  --neon-icon2-bg: #f59e0b;
  --neon-icon2-color: #FFFFFF;
  --neon-blob2: rgba(245, 158, 11, 0.15);
  
  /* Red (Card 3) */
  --neon-card3-border: rgba(239, 68, 68, 0.4);
  --neon-card3-shadow: 0 8px 32px rgba(239, 68, 68, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.5);
  --neon-icon3-bg: #ef4444;
  --neon-icon3-color: #FFFFFF;
  --neon-blob3: rgba(239, 68, 68, 0.15);

`
);

fs.writeFileSync(cssPath, cssContent);

// Update Admin.js to use the new variables
// For Card 1
adminContent = adminContent.replace(
  /var\(--neon-card-border\)/g,
  function(match, offset, string) {
    if (string.substring(offset - 100, offset).includes('Unidades Activas') || string.substring(offset - 300, offset).includes('Unidades Activas')) {
      return 'var(--neon-card1-border)';
    }
    if (string.substring(offset - 100, offset).includes('Personal en Turno') || string.substring(offset - 300, offset).includes('Personal en Turno')) {
      return 'var(--neon-card2-border)';
    }
    return match;
  }
);
adminContent = adminContent.replace(/var\(--neon-shadow\)/g, function(match, offset, string) {
    if (string.substring(offset - 200, offset + 200).includes('Unidades Activas')) return 'var(--neon-card1-shadow)';
    if (string.substring(offset - 200, offset + 200).includes('Personal en Turno')) return 'var(--neon-card2-shadow)';
    return match;
});
adminContent = adminContent.replace(/var\(--neon-icon-bg\)/g, function(match, offset, string) {
    if (string.substring(offset - 200, offset + 200).includes('UNIDADES ACTIVAS')) return 'var(--neon-icon1-bg)';
    if (string.substring(offset - 200, offset + 200).includes('PERSONAL EN TURNO')) return 'var(--neon-icon2-bg)';
    return match;
});
adminContent = adminContent.replace(/var\(--neon-icon-color\)/g, function(match, offset, string) {
    if (string.substring(offset - 200, offset + 200).includes('UNIDADES ACTIVAS')) return 'var(--neon-icon1-color)';
    if (string.substring(offset - 200, offset + 200).includes('PERSONAL EN TURNO')) return 'var(--neon-icon2-color)';
    return match;
});
adminContent = adminContent.replace(/var\(--neon-progress-fill\)/g, function(match, offset, string) {
    if (string.substring(offset - 200, offset + 200).includes('unidadesActivas')) return 'var(--neon-icon1-color)'; // fallback to icon color for progress
    if (string.substring(offset - 200, offset + 200).includes('personalTurno')) return 'var(--neon-icon2-color)';
    return match;
});

// For Card 3 (Alert)
adminContent = adminContent.replace(/var\(--neon-card-border-alert\)/g, 'var(--neon-card3-border)');
adminContent = adminContent.replace(/var\(--neon-shadow-alert\)/g, 'var(--neon-card3-shadow)');
adminContent = adminContent.replace(/var\(--neon-icon-bg-alert\)/g, 'var(--neon-icon3-bg)');
adminContent = adminContent.replace(/var\(--neon-icon-color-alert\)/g, 'var(--neon-icon3-color)');
adminContent = adminContent.replace(/var\(--neon-progress-fill-alert\)/g, 'var(--neon-icon3-color)');

// We also need to add the third blob and update blobs in Admin.js
adminContent = adminContent.replace(
  /<div style={{ position: 'absolute', top: '-10%', right: '5%', width: '35%', height: '120%', background: 'var\(--neon-blob2\)', filter: 'blur\(60px\)', zIndex: 0, borderRadius: '50%', pointerEvents: 'none', transition: 'background 0\.3s' }} \/>/,
  `<div style={{ position: 'absolute', top: '-10%', right: '5%', width: '35%', height: '120%', background: 'var(--neon-blob2)', filter: 'blur(60px)', zIndex: 0, borderRadius: '50%', pointerEvents: 'none', transition: 'background 0.3s' }} />
              <div style={{ position: 'absolute', top: '10%', left: '35%', width: '30%', height: '100%', background: 'var(--neon-blob3)', filter: 'blur(60px)', zIndex: 0, borderRadius: '50%', pointerEvents: 'none', transition: 'background 0.3s' }} />`
);

fs.writeFileSync(adminPath, adminContent);
console.log('Colors successfully mapped.');
