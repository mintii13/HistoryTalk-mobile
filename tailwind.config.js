/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ['./src/**/*.{js,jsx,ts,tsx}'],
  presets: [require('nativewind/preset')],
  theme: {
    extend: {
      colors: {
        history: {
          bg: '#ECE7DC',
          surface: '#F5F2EA',
          text: '#111111',
          muted: '#5F5B55',
          border: 'rgba(17,17,17,0.14)',
          accent: '#B8321F',
          accentSoft: '#9A2A18',
          darkBg: '#0e1a2b',
          darkSurface: '#1a2436',
          darkText: '#f7f1e8',
          darkMuted: '#dfdab5',
          darkAccent: '#EA7A0A',
          darkAccentSoft: '#e2c77a',
        },
        primary: {
          50:  '#F5F2EA',
          100: '#ECE7DC',
          200: '#F4D3CB',
          300: '#E89A86',
          400: '#D66A52',
          500: '#B8321F',
          600: '#9A2A18',
          700: '#7A1F12',
          800: '#5C170D',
          900: '#111111',
        },
      },
      fontFamily: {
        sans: ['Inter-Regular', 'Inter', 'System'],
        display: ['BigShoulders-ExtraBold', 'Arial Narrow', 'sans-serif'],
      },
    },
  },
  plugins: [],
};
