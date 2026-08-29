/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#fff7ed',
          100: '#ffedd5',
          200: '#ffd9a8',
          300: '#ffbd70',
          400: '#ffa23d',
          500: '#fb8b1e',
          600: '#f5841f',
          700: '#c9650f',
          800: '#9c4d0c',
          900: '#6b350a'
        },
        cream: {
          DEFAULT: '#fff9f2',
          50: '#fffcf9',
          100: '#fff9f2'
        }
      },
      fontFamily: {
        sans: ['"Nunito"', 'system-ui', 'sans-serif']
      }
    }
  },
  plugins: []
}
