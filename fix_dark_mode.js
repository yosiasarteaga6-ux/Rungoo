const fs = require('fs');
const path = require('path');

const indexCssPath = path.join(__dirname, 'src', 'index.css');
let indexCss = fs.readFileSync(indexCssPath, 'utf8');

// Replace :root { /* Dark Mode (Default) */ with :root, [data-theme="dark"] {
indexCss = indexCss.replace(/:root \{\s*\/\* Dark Mode \(Default\) \*\//, ':root, [data-theme="dark"] {\n  /* Dark Mode (Default) */');

fs.writeFileSync(indexCssPath, indexCss);
console.log('Added [data-theme="dark"] to index.css');
