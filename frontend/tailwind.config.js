/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  theme: {
    extend: {
      colors: {
        infra: {
          navy: '#10243A',           // Deep Infrastructure Navy
          steel: '#24445F',          // Steel Blue
          amber: '#F5A623',          // Construction Amber
          'amber-hover': '#E0921B',
          teal: '#13A89E',           // Infrastructure Teal
          'teal-dark': '#0E827B',
          concrete: '#F3F5F6',       // Soft Concrete Background
          white: '#FFFFFF',          // Surface White
          charcoal: '#202B36',       // Text Charcoal
          muted: '#718096',          // Muted Text
          border: '#DCE3E8',         // Border Line
          success: '#219653',        // Success Green
          warning: '#E9A23B',        // Warning Amber
          error: '#D64545',          // Error Red
        },
        navy: {
          950: '#0B1928',
          900: '#10243A', // Primary Deep Infrastructure Navy
          800: '#1B3550',
          700: '#24445F', // Steel Blue
          600: '#325777',
        },
        steel: {
          500: '#24445F',
          600: '#1C374E',
        },
        amber: {
          400: '#FBBF24',
          500: '#F5A623', // Construction Amber
          600: '#E0921B',
        },
        teal: {
          50: '#f0fdfa',
          100: '#ccfbf1',
          200: '#99f6e4',
          500: '#13A89E', // Infrastructure Teal
          600: '#0E827B',
          700: '#0f766e',
        },
        surface: {
          canvas: '#F3F5F6', // Soft Concrete
          main: '#F3F5F6',   // Soft Concrete
          card: '#FFFFFF',   // Surface White
          border: '#DCE3E8', // Enterprise Border
          hover: '#EAEFF2',
        },
        ink: {
          primary: '#202B36',   // Charcoal
          secondary: '#718096', // Muted Text
          muted: '#8C9BAE',
        },
        status: {
          success: '#219653',
          'success-bg': '#E8F5E9',
          warning: '#E9A23B',
          'warning-bg': '#FFF8E1',
          danger: '#D64545',
          'danger-bg': '#FFEBEE',
          info: '#24445F',
          'info-bg': '#EBF2F7',
        }
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(16, 36, 58, 0.05), 0 1px 2px -1px rgba(16, 36, 58, 0.03)',
        'card-hover': '0 6px 16px -2px rgba(16, 36, 58, 0.08), 0 2px 6px -1px rgba(16, 36, 58, 0.04)',
        'elevated': '0 12px 28px -4px rgba(16, 36, 58, 0.12), 0 4px 10px -2px rgba(16, 36, 58, 0.06)',
        'modal': '0 20px 30px -6px rgba(16, 36, 58, 0.20), 0 10px 14px -4px rgba(16, 36, 58, 0.10)',
        'dropdown': '0 10px 15px -3px rgba(16, 36, 58, 0.08), 0 4px 6px -4px rgba(16, 36, 58, 0.04)',
      }
    },
  },
  plugins: [],
}

