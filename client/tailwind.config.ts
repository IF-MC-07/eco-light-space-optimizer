import type { Config } from 'tailwindcss';

export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        primary: {
          DEFAULT: '#2E7D32',
          dark:    '#1B4D1E',
          light:   '#4CAF50',
        },
        secondary: {
          DEFAULT: '#475569',
          dark:    '#1E293B',
          light:   '#94A3B8',
        },
        tertiary: {
          DEFAULT: '#883454',
          dark:    '#5C1F38',
          light:   '#C4678A',
        },
        neutral: {
          DEFAULT: '#F8FAFC',
          surface: '#FFFFFF',
          border:  '#E2E8F0',
          muted:   '#CBD5E1',
        }
      },
      fontFamily: {
        heading: ['Manrope', 'sans-serif'],
        body: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        card: '0 1px 3px rgba(0,0,0,0.08), 0 1px 2px rgba(0,0,0,0.04)',
        elevated: '0 4px 12px rgba(0,0,0,0.10)',
      }
    },
  },
  plugins: [],
} satisfies Config;
