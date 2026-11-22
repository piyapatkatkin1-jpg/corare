/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        mc: {
          dark: '#070d18',
          card: '#0c1524',
          cardLight: '#132034',
          accent: '#38bdf8', // Light Blue / Sky
          accentHover: '#0ea5e9',
          sky: '#38bdf8',
          cyan: '#06b6d4',
          gold: '#f59e0b',
          goldHover: '#d97706',
          purple: '#a855f7',
          red: '#ef4444'
        }
      },
      fontFamily: {
        minecraft: ['"Segoe UI"', 'Roboto', 'sans-serif'],
      },
      boxShadow: {
        'glow-sky': '0 0 25px -3px rgba(56, 189, 248, 0.45)',
        'glow-cyan': '0 0 25px -3px rgba(6, 182, 212, 0.45)',
        'glow-gold': '0 0 25px -3px rgba(245, 158, 11, 0.4)',
      }
    },
  },
  plugins: [],
}
