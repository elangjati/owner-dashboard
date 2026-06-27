/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          50:  '#fdf8f3',
          100: '#f5e6d3',
          200: '#e8c9a0',
          300: '#d4a06a',
          400: '#c07840',
          500: '#8B4513',
          600: '#7a3c10',
          700: '#6b340e',
          800: '#1a3a1a',    // Exactly Laravel - dark green-brown
          900: '#122812',    // Exactly Laravel - very dark
        }
      }
    },
  },
  plugins: [],
}
