/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{html,ts}",
  ],
  theme: {
    extend: {
      colors: {
        // Primary — Azul profesional
        primary: {
          DEFAULT: '#0F6FFF',
          dark:    '#0A50C8',
          light:   '#E8F0FE',
        },
        // Semánticos
        success: '#10B981',
        warning: '#F59E0B',
        danger:  '#EF4444',
        info:    '#3B82F6',
        // Neutros
        surface: '#FFFFFF',
        background: '#F8FAFC',
        border: '#E2E8F0',
        // Texto
        'text-primary':   '#1E293B',
        'text-secondary': '#64748B',
        'text-disabled':  '#94A3B8',
        // Sidebar
        'sidebar-bg':   '#1E293B',
        'sidebar-text': '#94A3B8',
        'sidebar-active-bg':   '#0F6FFF',
        'sidebar-active-text': '#FFFFFF',
      },
      fontFamily: {
        sans: ['Inter', '-apple-system', 'BlinkMacSystemFont', 'Segoe UI', 'sans-serif'],
      },
      fontSize: {
        'display': ['30px', { fontWeight: '700', lineHeight: '1.2' }],
      },
      boxShadow: {
        'card': '0 1px 3px 0 rgba(0, 0, 0, 0.08), 0 1px 2px -1px rgba(0, 0, 0, 0.04)',
        'card-hover': '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -2px rgba(0, 0, 0, 0.06)',
      },
      borderRadius: {
        'card': '12px',
      },
      screens: {
        'xs': '480px',
      },
    },
  },
  plugins: [],
}
