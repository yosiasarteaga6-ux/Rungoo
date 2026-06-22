const fs = require('fs');
const path = require('path');

const cssPath = path.join(__dirname, 'src', 'App.css');
let cssContent = fs.readFileSync(cssPath, 'utf8');

// 1. Remove the old map from main-content
cssContent = cssContent.replace(
  /\[data-theme="light"\] \.main-content::before \{[\s\S]*?\}\n/,
  ''
);

// 2. Add the global map background to the App class
const globalMapCss = \`

/* ========================================================
   FONDO DE MAPA GLOBAL (Todas las interfaces, incluido Login)
   ======================================================== */
.App::after {
  content: '';
  position: fixed;
  inset: 0;
  background-size: cover;
  background-position: center;
  background-repeat: no-repeat;
  z-index: 0;
  pointer-events: none;
  /* Máscara suave para que el mapa se integre sutilmente con el fondo */
  mask-image: radial-gradient(ellipse at center, black 10%, transparent 95%);
  -webkit-mask-image: radial-gradient(ellipse at center, black 10%, transparent 95%);
  transition: opacity 0.5s ease, background-image 0.5s ease;
}

/* Mapa en Modo Claro */
[data-theme="light"] .App::after {
  background-image: url('https://a.basemaps.cartocdn.com/rastertiles/voyager/14/4960/7650.png'), url('https://b.basemaps.cartocdn.com/rastertiles/voyager/14/4961/7650.png'), url('https://c.basemaps.cartocdn.com/rastertiles/voyager/13/2411/3079.png');
  opacity: 0.65;
}

/* Mapa en Modo Oscuro (Carto Dark Matter) */
:root .App::after, [data-theme="dark"] .App::after {
  background-image: url('https://a.basemaps.cartocdn.com/rastertiles/dark_all/14/4960/7650.png'), url('https://b.basemaps.cartocdn.com/rastertiles/dark_all/14/4961/7650.png'), url('https://c.basemaps.cartocdn.com/rastertiles/dark_all/13/2411/3079.png');
  opacity: 0.25; /* Más sutil en modo oscuro para no distraer */
}
\`;

// Inject right after the .App::before rule
cssContent = cssContent.replace(
  /(\.App::before \{[\s\S]*?\n\})/,
  \`$1\${globalMapCss}\`
);

// Also, the login wrapper shouldn't block the background completely
// The login-hero-panel has a background. It's ok if it stays, but we might want the right panel to show the map.
// The .login-right-panel is usually white/dark. Let's make sure it has slight transparency or the map will just show on the edges.
// We'll leave the panels as is, the vignette mask will show the map in the center. 
// Wait, the map has z-index 0. .App is the root.
// The login-wrapper has z-index 1. So the map will be underneath.

fs.writeFileSync(cssPath, cssContent);
console.log('Global map added.');
