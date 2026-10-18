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
        // Holy Name Medical Center's navy, as the ink colour.
        navy: {
          50: '#E8EFE9',
          100: '#CFDDD2',
          200: '#A9C2AF',
          300: '#7DA389',
          400: '#4F8460',
          500: '#2A6A3C',
          600: '#1E4D2B',
          700: '#163A20',
          800: '#10301C',
          900: '#0B2014',
        },
        teal: {
          50: '#F0ECE6',
          100: '#E1DAD2',
          200: '#C8BEB3',
          300: '#A9A197',
          400: '#7E756E',
          500: '#6B645D',
          600: '#574F49',
          700: '#4E4741',
          800: '#3E3933',
          900: '#2E2A27',
        },
        cream: {
          50: '#F7F5F1',
          100: '#F1F0EC',
          200: '#ECE8E1',
          300: '#E7E2D8',
          400: '#D9D2C7',
        },
        medical: {
          green: '#28A745',
          amber: '#F5A623',
          red: '#DC3545',
          blue: '#7E756E',
        },
      },
      fontFamily: {
        sans: ['Figtree', 'system-ui', '-apple-system', 'sans-serif'],
        serif: ['"Cormorant Garamond"', 'Georgia', 'Cambria', 'serif'],
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
