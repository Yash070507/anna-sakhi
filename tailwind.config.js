/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Konkan Coastal Palette
        cream: {
          50:  '#FDFBF7',
          100: '#FAF7F2',
          200: '#F3EDE3',
          300: '#EAE0D0',
          400: '#DDD0BC',
          500: '#CEBFA8',
        },
        palm: {
          50:  '#EEF4E8',
          100: '#D5E8C5',
          200: '#A8CF89',
          300: '#7AB64F',
          400: '#5A9A34',
          500: '#3D7220',
          600: '#2D5016',
          700: '#1E360E',
          800: '#111F08',
          900: '#070F03',
        },
        sea: {
          50:  '#E8F4F7',
          100: '#C5E3EA',
          200: '#89C5D3',
          300: '#4FA3B8',
          400: '#3D8FA4',
          500: '#2E7A8A',
          600: '#1F5F6D',
          700: '#134550',
          800: '#092E37',
          900: '#031820',
        },
        terracotta: {
          50:  '#FBF0EB',
          100: '#F5D9CC',
          200: '#EAB099',
          300: '#DE8468',
          400: '#D4603E',
          500: '#C4622D',
          600: '#A0481D',
          700: '#7A3213',
          800: '#551F0B',
          900: '#301005',
        },
        earth: {
          50:  '#F5EFE8',
          100: '#E8D9C8',
          200: '#CEB090',
          300: '#B48760',
          400: '#9E6E45',
          500: '#8B5E3C',
          600: '#6E4A2D',
          700: '#51361F',
          800: '#372413',
          900: '#1E1208',
        },
      },
      fontFamily: {
        display: ['Fraunces', 'Georgia', 'serif'],
        sans: ['Inter', 'system-ui', 'sans-serif'],
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'slide-in-left': 'slideInLeft 0.3s ease-out',
        'pulse-soft': 'pulseSoft 2s ease-in-out infinite',
        'typing': 'typing 1.2s ease-in-out infinite',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { opacity: '0', transform: 'translateY(16px)' },
          '100%': { opacity: '1', transform: 'translateY(0)' },
        },
        slideInLeft: {
          '0%': { opacity: '0', transform: 'translateX(-16px)' },
          '100%': { opacity: '1', transform: 'translateX(0)' },
        },
        pulseSoft: {
          '0%, 100%': { opacity: '1' },
          '50%': { opacity: '0.6' },
        },
        typing: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-4px)' },
        },
      },
      boxShadow: {
        'soft': '0 2px 12px 0 rgba(44, 31, 14, 0.08)',
        'card': '0 4px 24px 0 rgba(44, 31, 14, 0.10)',
        'lifted': '0 8px 32px 0 rgba(44, 31, 14, 0.14)',
        'dark-soft': '0 2px 12px 0 rgba(0, 0, 0, 0.3)',
        'dark-card': '0 4px 24px 0 rgba(0, 0, 0, 0.4)',
      },
    },
  },
  plugins: [],
};
