/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        'c-primary': '#4f46e5',
        'c-secondary': '#7c3aed',
        'c-accent': '#22d3ee',
        'c-dark': '#050505',
        'c-darker': '#000000',
        'c-card': 'rgba(0, 0, 0, 0.9)',
      },
      animation: {
        'glow': 'glow 2s ease-in-out infinite alternate',
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'float': 'float 6s ease-in-out infinite',
      },
      keyframes: {
        glow: {
          '0%': {
            textShadow: '0 0 10px #6366f1, 0 0 20px #6366f1, 0 0 30px #6366f1',
            filter: 'brightness(1)'
          },
          '100%': {
            textShadow: '0 0 20px #8b5cf6, 0 0 40px #8b5cf6, 0 0 60px #8b5cf6',
            filter: 'brightness(1.2)'
          }
        },
        float: {
          '0%, 100%': { transform: 'translateY(0px)' },
          '50%': { transform: 'translateY(-10px)' }
        }
      },
      backdropBlur: {
        xs: '2px',
      }
    },
  },
  plugins: [],
}
