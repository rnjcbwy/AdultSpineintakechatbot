/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        // Brand palette: deep navy and the teal from the practice's print
        // material. 600 is the reference navy; teal-300 is the reference teal,
        // teal-400 the same hue darkened enough to read as text on white.
        // "navy" is the ink colour: a deep slate rather than a hospital navy,
        // so the form reads as a clean document, not a brand.
        navy: {
          50: '#F3F5F8',
          100: '#E3E8EE',
          200: '#C7D0DB',
          300: '#98A6B8',
          400: '#5C6B7E',
          500: '#334155',
          600: '#1E293B',
          700: '#16202E',
          800: '#0F172A',
          900: '#0B1120',
        },
        teal: {
          50: '#E3F3F3',
          100: '#BFE9E8',
          200: '#8ADAD9',
          300: '#38BFBD',
          400: '#0E8482',
          500: '#0B7472',
          600: '#095E5C',
          700: '#074846',
          800: '#053230',
          900: '#021C1B',
        },
        cream: {
          50: '#FEFDFB',
          100: '#FAF8F5',
          200: '#F5F2ED',
          300: '#EBE7E0',
          400: '#DDD8CE',
        },
        medical: {
          green: '#28A745',
          amber: '#F5A623',
          red: '#DC3545',
          blue: '#2E86AB',
        },
      },
      fontFamily: {
        sans: ['"DM Sans"', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Source Serif 4"', 'Georgia', 'Cambria', 'serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in': 'slideIn 0.3s ease-out',
        'pulse-dot': 'pulseDot 1.4s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(20px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideIn: {
          '0%': { opacity: '0', transform: 'translateX(-10px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseDot: {
          '0%, 80%, 100%': { transform: 'scale(0)' },
          '40%': { transform: 'scale(1)' },
        },
      },
    },
  },
  plugins: [],
};
