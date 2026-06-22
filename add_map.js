const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'App.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

// We need to add a map background to .main-content
// But we want it to look exactly like the mockup: a map with a vignette fade
// so it blends into the white background.

if (!cssContent.includes('--map-bg-url')) {
  // Let's add variables at the top or just directly to main-content
  const mapCss = `
/* Fondo de mapa para el contenido principal */
.main-content {
  flex-grow: 1;
  padding: 40px;
  overflow-y: auto;
  position: relative;
  z-index: 1;
}

[data-theme="light"] .main-content::before {
  content: '';
  position: absolute;
  top: 0; left: 0; right: 0; bottom: 0;
  /* Imagen de mapa genérica (OpenStreetMap / Carto estilo claro) */
  background-image: url('https://a.basemaps.cartocdn.com/rastertiles/voyager/14/4960/7650.png'), url('https://b.basemaps.cartocdn.com/rastertiles/voyager/14/4961/7650.png');
  background-size: 512px;
  background-repeat: repeat;
  opacity: 0.6;
  z-index: -1;
  /* Máscara para difuminar los bordes (Vignette) y que se funda con el fondo blanco */
  mask-image: radial-gradient(circle at center, black 20%, transparent 80%);
  -webkit-mask-image: radial-gradient(circle at center, black 20%, transparent 80%);
  pointer-events: none;
}
`;

  cssContent = cssContent.replace(
    /^\.main-content\s*\{[\s\S]*?\}/m,
    mapCss
  );

  fs.writeFileSync(cssPath, cssContent);
  console.log('Map background added to App.css');
} else {
  console.log('Map background already exists.');
}
