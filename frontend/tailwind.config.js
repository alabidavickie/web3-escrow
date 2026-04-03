/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,ts,jsx,tsx}'],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Inter', 'ui-sans-serif', 'system-ui', '-apple-system', 'sans-serif'],
      },
      colors: {
        brand: {
          50:  '#eef2ff',
          100: '#e0e7ff',
          200: '#c7d2fe',
          300: '#a5b4fc',
          400: '#818cf8',
          500: '#6366f1',
          600: '#4f46e5',
          700: '#4338ca',
          800: '#3730a3',
          900: '#312e81',
        },
        // Dark surface palette
        surface: {
          DEFAULT: '#111118',
          50:  '#1e1e2e',
          100: '#16162a',
          200: '#111118',
          300: '#0d0d14',
          400: '#09090f',
        },
      },
      backgroundImage: {
        'hero-gradient':  'linear-gradient(135deg, #4f46e5 0%, #7c3aed 50%, #a855f7 100%)',
        'card-gradient':  'linear-gradient(135deg, rgba(99,102,241,0.06) 0%, rgba(124,58,237,0.06) 100%)',
        'dark-grid':      'radial-gradient(circle, rgba(99,102,241,0.06) 1px, transparent 1px)',
      },
      boxShadow: {
        card:  '0 1px 3px rgba(0,0,0,0.5), 0 0 0 1px rgba(255,255,255,0.05)',
        'card-hover': '0 4px 16px rgba(0,0,0,0.6), 0 0 0 1px rgba(99,102,241,0.2)',
        glow:  '0 0 32px rgba(99,102,241,0.18)',
        'glow-sm': '0 0 16px rgba(99,102,241,0.12)',
      },
      animation: {
        'fade-in': 'fadeIn 0.5s ease-out',
        'slide-up': 'slideUp 0.4s ease-out',
        'pulse-slow': 'pulse 3s ease-in-out infinite',
      },
      keyframes: {
        fadeIn:  { '0%': { opacity: '0' }, '100%': { opacity: '1' } },
        slideUp: { '0%': { opacity: '0', transform: 'translateY(16px)' }, '100%': { opacity: '1', transform: 'translateY(0)' } },
      },
    },
  },
  plugins: [],
};
