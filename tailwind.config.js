/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}",
  ],
  corePlugins: {
    // Desactivamos el Preflight (CSS reset de Tailwind) para no destruir
    // los estilos existentes de App.css mientras migramos gradualmente.
    preflight: false,
  },
  theme: {
    extend: {
      colors: {
        verde: {
          principal: '#2ecc71',
          oscuro: '#27ae60',
          fondo: '#0d2b1e',
        },
      },
      boxShadow: {
        'glow': '0 0 15px rgba(46, 204, 113, 0.25)',
        'glow-hover': '0 0 25px rgba(46, 204, 113, 0.45)',
      }
    },
  },
  plugins: [],
}
