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
          light: '#f8eed1',
          DEFAULT: '#c59b27',
          dark: '#9a7a1c',
          glow: 'rgba(197, 155, 39, 0.15)',
        },
        cream: {
          light: '#ffffff',
          DEFAULT: '#fdfbf7',
          dark: '#f5f0e6',
          deep: '#eae3d5',
        }
      },
      fontFamily: {
        sans: ['Outfit', 'Inter', 'sans-serif'],
      },
      boxShadow: {
        'gold-glow': '0 0 15px rgba(197, 155, 39, 0.2)',
        'gold-glow-lg': '0 0 25px rgba(197, 155, 39, 0.35)',
        'soft': '0 10px 40px -10px rgba(0,0,0,0.05)',
      }
    },
  },
  plugins: [],
}
