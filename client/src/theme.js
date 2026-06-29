// src/theme.js
// ─────────────────────────────────────────────────────────────────────────────
// PALETA CENTRALIZADA DE COLORES — Ruta Express
// Importa esto en cualquier componente y úsalo en estilos inline.
// Los mismos valores están como variables CSS en App.css (:root).
// ─────────────────────────────────────────────────────────────────────────────

const theme = {
  // ── Azules (marca principal) ────────────────────────────────────────────────
  azulPrincipal: '#3b82f6', // Azul Eléctrico
  azulOscuro:    '#2563eb', // Índigo brillante / Azul oscuro
  azulCielo:     '#38bdf8', // Azul Cielo para flotantes
  azulFondo:     '#0a192f', // Azul Marino Profundo
  azulGlow:      'rgba(59, 130, 246, 0.25)',
  azulBorder:    'rgba(59, 130, 246, 0.3)',
  azulSubtle:    'rgba(59, 130, 246, 0.12)',

  // ── Amarillos / Naranjas (Avisos) ───────────────────────────────────────────
  amarillo:     '#f1c40f',
  naranja:      '#e67e22',
  naranjaOscuro:'#d35400',

  // ── Rojos (alertas / logout) ────────────────────────────────────────────────
  rojo:         '#e74c3c',
  rojoOscuro:   '#c0392b',
  rojoSubtle:   'rgba(231, 76, 60, 0.15)',

  // ── Verdes (éxitos) ─────────────────────────────────────────────────────────
  verde:        '#10b981', // Emerald green para success states
  verdeOscuro:  '#059669',

  // ── Neutros / Fondos / Glassmorphism ────────────────────────────────────────
  fondoApp:     '#0a192f', // Azul Marino Profundo
  glassCardBg:  'rgba(28, 40, 51, 0.45)', // Azul pizarra oscuro 45%
  glassCardBorder:'rgba(255, 255, 255, 0.1)', // Borde blanco 10%
  fondoSidebar: 'rgba(15, 23, 42, 0.5)',
  fondoInput:   'rgba(15, 23, 42, 0.6)',
  glassDark:    'rgba(15, 23, 42, 0.75)',

  // ── Texto ────────────────────────────────────────────────────────────────────
  textoPrimario:  '#ffffff',
  textoSecundario:'rgba(255, 255, 255, 0.55)',
  textoMuted:     'rgba(255, 255, 255, 0.3)',
  textoLabel:     'rgba(255, 255, 255, 0.6)',

  // ── Bordes / Separadores ────────────────────────────────────────────────────
  borde:          'rgba(255, 255, 255, 0.08)',
  bordeSutil:     'rgba(255, 255, 255, 0.04)',

  // ── Radios / Espaciado ──────────────────────────────────────────────────────
  radiusCard:   '16px',
  radiusBtn:    '12px',
  radiusInput:  '14px',
  radiusPill:   '30px',

  // ── Sombras ─────────────────────────────────────────────────────────────────
  shadowCard:   '0 10px 30px rgba(0, 0, 0, 0.4)',
  shadowGlow:   '0 0 20px rgba(59, 130, 246, 0.2)',
};

export default theme;
