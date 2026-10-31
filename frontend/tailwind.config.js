/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        navy: {
          950: '#0d1827',
          900: '#14243A', // Primary Navy
          800: '#203650', // Secondary Navy
          700: '#2a4768',
          600: '#395c85',
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          500: '#14b8a6',
          600: '#0D9488', // Accent Teal
          700: '#0f766e',
        },
        surface: {
          main: '#F4F7FA', // Main background
          card: '#FFFFFF', // Card background
          border: '#E2E8F0', // Border subtle
          hover: '#F8FAFC',
        },
        ink: {
          primary: '#172033', // Primary text
          secondary: '#64748B', // Secondary text
          muted: '#94A3B8',
        },
        brand: {
          50: '#eef8ff',
          100: '#d8eeff',
          500: '#2b97ff',
          600: '#1478f5',
          700: '#0d5fe1',
        },
        status: {
          success: '#16A34A',
          'success-bg': '#F0FDF4',
          warning: '#D97706',
          'warning-bg': '#FFFBEB',
          danger: '#DC2626',
          'danger-bg': '#FEF2F2',
          info: '#2563EB',
          'info-bg': '#EFF6FF',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.05), 0 1px 2px -1px rgba(0, 0, 0, 0.05)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.07), 0 2px 4px -2px rgba(0, 0, 0, 0.05)',
        'modal': '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.05)',
        'dropdown': '0 10px 15px -3px rgba(0, 0, 0, 0.08), 0 4px 6px -4px rgba(0, 0, 0, 0.04)',
      }
    },
  },
  plugins: [],
}
