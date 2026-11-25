/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{ts,tsx}'],
  theme: {
    extend: {
      colors: {
        brand: {
          50: '#eef4ff',
          100: '#dce7ff',
          200: '#c0d4ff',
          300: '#94b7ff',
          400: '#6190ff',
          500: '#3b66f5',
          600: '#1f44db',
          700: '#1935b8',
          800: '#1a2d94',
          900: '#1a2a75',
          950: '#111948',
        },
        saffron: {
          50: '#fff8ed',
          100: '#ffefd4',
          500: '#f59e0b',
          600: '#d97706',
          700: '#b45309',
        },
        emeraldBrand: {
          50: '#ecfdf5',
          600: '#059669',
          700: '#047857',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'Segoe UI', 'Roboto', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
