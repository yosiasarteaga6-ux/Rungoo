const fs = require('fs');
const path = require('path');

const indexCssPath = path.join(__dirname, 'src', 'index.css');
let indexCss = fs.readFileSync(indexCssPath, 'utf8');

const themeVariables = `
/* ========================================================
   THEME VARIABLES (Rutaexpress Oscuro & Claro)
   ======================================================== */
:root {
  /* Dark Mode (Default) */
  --bg-color: #0F172A; /* Navy */
  --card-bg: rgba(71, 85, 105, 0.45); /* Slate #475569 with opacity */
  --card-border: rgba(255, 255, 255, 0.1);
  --primary-color: #6366F1; /* Indigo Blue */
  --primary-glow: rgba(99, 102, 241, 0.3);
  --secondary-color: #7DD3FC; /* Sky Blue */
  --text-main: #FFFFFF;
  --text-muted: rgba(255, 255, 255, 0.6);
  --sidebar-bg: rgba(15, 23, 42, 0.6);
  --input-bg: rgba(71, 85, 105, 0.3);
}

[data-theme="light"] {
  /* Light Mode */
  --bg-color: #F8FAFC; /* Light Gray */
  --card-bg: rgba(226, 232, 240, 0.6); /* Neutral Gray #E2E8F0 with opacity */
  --card-border: rgba(255, 255, 255, 0.4);
  --primary-color: #2563EB; /* Electric Blue */
  --primary-glow: rgba(37, 99, 235, 0.3);
  --secondary-color: #475569; /* Slate */
  --text-main: #1E293B; /* Dark Navy Text */
  --text-muted: rgba(30, 41, 59, 0.6);
  --sidebar-bg: rgba(226, 232, 240, 0.8);
  --input-bg: rgba(255, 255, 255, 0.6);
}

body {
  background-color: var(--bg-color);
  color: var(--text-main);
  transition: background-color 0.3s ease, color 0.3s ease;
}
`;

if (!indexCss.includes('--bg-color')) {
  fs.appendFileSync(indexCssPath, themeVariables);
  console.log('Added theme variables to index.css');
}

// Now update App.css
const appCssPath = path.join(__dirname, 'src', 'App.css');
let appCss = fs.readFileSync(appCssPath, 'utf8');

// Replace hardcoded values with var()
appCss = appCss.replace(/background: #0a192f;/g, 'background: var(--bg-color);');
appCss = appCss.replace(/background: rgba\(28, 40, 51, 0\.45\);/g, 'background: var(--card-bg);');
appCss = appCss.replace(/color: #ffffff;/g, 'color: var(--text-main);');
appCss = appCss.replace(/color: #fff;/g, 'color: var(--text-main);');
appCss = appCss.replace(/#3b82f6/g, 'var(--primary-color)');
appCss = appCss.replace(/#2563eb/g, 'var(--primary-color)');

const glassCardOverride = `
/* ========================================================
   GLASSMORPHISM CLASSES (THEMED)
   ======================================================== */
.glass-card {
  background: var(--card-bg) !important;
  backdrop-filter: blur(12px);
  -webkit-backdrop-filter: blur(12px);
  border: 1px solid var(--card-border) !important;
  box-shadow: 0 8px 32px rgba(0, 0, 0, 0.15) !important;
  border-radius: 16px;
  color: var(--text-main) !important;
}

[data-theme="light"] .glass-card {
  box-shadow: 0 8px 32px rgba(31, 38, 135, 0.1) !important;
}

.dashboard-container {
  background: var(--bg-color) !important;
  color: var(--text-main) !important;
}

.main-content, .sidebar {
  transition: background 0.3s ease, border-color 0.3s ease;
}

.sidebar {
  background: var(--sidebar-bg) !important;
  border-right: 1px solid var(--card-border) !important;
}

.main-header h2, .sidebar-profile h3, .parada-card h3 {
  color: var(--text-main) !important;
}

.bottom-nav {
  background: var(--sidebar-bg) !important;
  border-top: 1px solid var(--card-border) !important;
}

.bottom-nav-item span, .bottom-nav-item .nav-icon {
  color: var(--text-muted);
}
.bottom-nav-item.active span, .bottom-nav-item.active .nav-icon {
  color: var(--primary-color) !important;
}

.sidebar-btn {
  color: var(--text-muted) !important;
}
.sidebar-btn.active {
  background: var(--primary-glow) !important;
  color: var(--primary-color) !important;
  border-color: var(--primary-color) !important;
}

.btn-login {
  background: var(--primary-color) !important;
  color: #fff !important;
}

.input-with-icon-wrapper input {
  background: var(--input-bg) !important;
  color: var(--text-main) !important;
  border: 1.5px solid var(--card-border) !important;
}

.login-form-panel {
  background: var(--card-bg) !important;
  border: 1px solid var(--card-border) !important;
}

.glow-marker-dot {
  background: var(--primary-color) !important;
  box-shadow: 0 0 10px var(--primary-glow) !important;
}
.glow-marker-ring {
  border-color: var(--primary-color) !important;
}
.leaflet-route-polyline {
  stroke: var(--primary-color) !important;
  filter: drop-shadow(0 0 8px var(--primary-glow)) !important;
}

/* Light mode specific text adjustments */
[data-theme="light"] .login-subtitle,
[data-theme="light"] .login-calderas,
[data-theme="light"] .brand-name span {
  color: var(--primary-color) !important;
}

[data-theme="light"] .sidebar-profile p {
  color: var(--primary-color) !important;
}
`;

appCss = appCss.replace(/\/\* ========================================================\n   GLASSMORPHISM CLASSES\n   ======================================================== \*\/[\s\S]*$/, glassCardOverride);

fs.writeFileSync(appCssPath, appCss);
console.log('App.css updated with theme variables.');
