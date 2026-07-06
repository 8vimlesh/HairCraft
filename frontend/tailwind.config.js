/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        gold: {
          light: '#f5e4b7',
          DEFAULT: '#d4af37',
          dark: '#9a7a1c',
          glow: 'rgba(212, 175, 55, 0.15)',
        },
        charcoal: {
          light: '#2d2d2d',
          DEFAULT: '#1c1c1c',
          dark: '#0f0f0f',
          deep: '#0a0a0a',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 15px rgba(212, 175, 55, 0.2)',
        'gold-glow-lg': '0 0 25px rgba(212, 175, 55, 0.35)',
      }
    },
  },
  plugins: [],
}
