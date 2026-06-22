const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'index.css');
let content = fs.readFileSync(filePath, 'utf8');

// If we already injected neon variables, don't do it again
if (!content.includes('--neon-card-bg')) {
  // Add to dark mode
  content = content.replace(
    ':root, [data-theme="dark"] {',
    `:root, [data-theme="dark"] {
  --neon-card-bg: rgba(15, 23, 42, 0.65);
  --neon-card-border: rgba(56, 189, 248, 0.4);
  --neon-card-border-alert: rgba(248, 113, 113, 0.4);
  --neon-shadow: 0 8px 32px rgba(0,0,0,0.3), 0 0 15px rgba(56, 189, 248, 0.2), inset 0 0 20px rgba(56, 189, 248, 0.05);
  --neon-shadow-alert: 0 8px 32px rgba(0,0,0,0.3), 0 0 15px rgba(248, 113, 113, 0.2), inset 0 0 20px rgba(248, 113, 113, 0.05);
  --neon-text-num: var(--text-main);
  --neon-icon-bg: rgba(56, 189, 248, 0.2);
  --neon-icon-color: #38bdf8;
  --neon-icon-bg-alert: rgba(248, 113, 113, 0.2);
  --neon-icon-color-alert: #f87171;
  --neon-blob1: rgba(56, 189, 248, 0.15);
  --neon-blob2: rgba(248, 113, 113, 0.12);
  --neon-header-bg: rgba(255,255,255,0.05);
  --neon-header-border: rgba(255,255,255,0.1);
  --neon-progress-track: rgba(255,255,255,0.1);
  --neon-progress-fill: #38bdf8;
  --neon-progress-fill-alert: #f87171;
`
  );

  // Add to light mode
  content = content.replace(
    '[data-theme="light"] {',
    `[data-theme="light"] {
  --neon-card-bg: rgba(255, 255, 255, 0.85);
  --neon-card-border: rgba(37, 99, 235, 0.3);
  --neon-card-border-alert: rgba(37, 99, 235, 0.3);
  --neon-shadow: 0 8px 32px rgba(37, 99, 235, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.5);
  --neon-shadow-alert: 0 8px 32px rgba(37, 99, 235, 0.15), inset 0 0 20px rgba(255, 255, 255, 0.5);
  --neon-text-num: #1E3A8A;
  --neon-icon-bg: #2563EB;
  --neon-icon-color: #FFFFFF;
  --neon-icon-bg-alert: #0F172A;
  --neon-icon-color-alert: #FFFFFF;
  --neon-blob1: rgba(37, 99, 235, 0.15);
  --neon-blob2: rgba(37, 99, 235, 0.15);
  --neon-header-bg: rgba(255,255,255,0.9);
  --neon-header-border: #E2E8F0;
  --neon-progress-track: rgba(0,0,0,0.1);
  --neon-progress-fill: #2563EB;
  --neon-progress-fill-alert: #0F172A;
`
  );

  fs.writeFileSync(filePath, content);
  console.log('Injected neon CSS variables.');
} else {
  console.log('Neon CSS variables already exist.');
}
