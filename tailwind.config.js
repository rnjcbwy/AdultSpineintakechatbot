/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './app/**/*.{js,ts,jsx,tsx}',
    './components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          50: '#EEF2F7',
          100: '#D4DEE9',
          200: '#A9BDD3',
          300: '#7E9CBD',
          400: '#537BA7',
          500: '#1A3A5C',
          600: '#0F2B46',
          700: '#0A1F33',
          800: '#061420',
          900: '#030A10',
        },
        teal: {
          50: '#E6F7F7',
          100: '#B3E8E8',
          200: '#80D9D9',
          300: '#4DCACA',
          400: '#2E86AB',
          500: '#257A9B',
          600: '#1C5E7A',
          700: '#134258',
          800: '#0A2637',
          900: '#010A15',
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
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['Georgia', 'Cambria', 'Times New Roman', 'serif'],
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
