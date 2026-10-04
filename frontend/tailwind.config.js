/** @type {import('tailwindcss').Config} */
export default {
  content: ['./index.html', './src/**/*.{js,jsx}'],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // ApplyPilot Design System — extended color palette
        'ap-blue':   '#007AFF',
        'ap-indigo': '#5856D6',
        'ap-green':  '#34C759',
        'ap-red':    '#FF3B30',
        'ap-orange': '#FF9500',
        'ap-amber':  '#FFCC00',
        'ap-purple': '#AF52DE',
        'ap-gray': {
          50:  '#F8FAFC',
          100: '#F2F2F7',
          200: '#E5E5EA',
          300: '#D1D1D6',
          400: '#C7C7CC',
          500: '#AEAEB2',
          600: '#8E8E93',
          700: '#636366',
          800: '#3A3A3C',
          900: '#1C1C1E',
        },
      },
      fontFamily: {
        sans: [
          '-apple-system',
          'BlinkMacSystemFont',
          '"SF Pro Display"',
          '"SF Pro Text"',
          'Inter',
          'system-ui',
          'sans-serif',
        ],
      },
      borderRadius: {
        'ap':    '12px',
        'ap-lg': '16px',
        'ap-xl': '24px',
      },
      boxShadow: {
        'ap-sm': '0 2px 8px rgba(0,0,0,0.06)',
        'ap':    '0 4px 16px rgba(0,0,0,0.08)',
        'ap-lg': '0 8px 32px rgba(0,0,0,0.12)',
        'ap-xl': '0 16px 56px rgba(0,0,0,0.16)',
        'ap-glow-blue':  '0 0 20px rgba(0,122,255,0.35)',
        'ap-glow-green': '0 0 20px rgba(52,199,89,0.35)',
      },
      animation: {
        shimmer:    'shimmer 1.5s infinite linear',
        'fade-in':  'fadeIn 0.25s ease',
        'slide-up': 'slideUp 0.3s cubic-bezier(0.32,0.72,0,1)',
        pulse:      'pulse 2s cubic-bezier(0.4,0,0.6,1) infinite',
      },
      keyframes: {
        shimmer: {
          from: { backgroundPosition: '-200% 0' },
          to:   { backgroundPosition:  '200% 0' },
        },
        fadeIn: {
          from: { opacity: 0 },
          to:   { opacity: 1 },
        },
        slideUp: {
          from: { transform: 'translateY(6px)', opacity: 0 },
          to:   { transform: 'translateY(0)',   opacity: 1 },
        },
        pulse: {
          '0%, 100%': { opacity: 1 },
          '50%':      { opacity: 0.5 },
        },
      },
    },
  },
  plugins: [],
};
