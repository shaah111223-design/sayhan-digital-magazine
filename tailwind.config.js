/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        yellow: {
          400: '#FACC15',
          500: '#EAB308',
          600: '#CA8A04',
          accent: '#FFD700',
          gold: '#F5BE0B'
        },
        dark: {
          950: '#070809',
          900: '#0C0D0E',
          850: '#111316',
          800: '#17191E',
          700: '#23262D',
          600: '#323640'
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Cinzel', 'Playfair Display', 'Georgia', 'serif']
      },
      boxShadow: {
        'gold-glow': '0 0 25px rgba(234, 179, 8, 0.25)',
        'gold-glow-lg': '0 0 45px rgba(234, 179, 8, 0.4)'
      }
    },
  },
  plugins: [],
}

