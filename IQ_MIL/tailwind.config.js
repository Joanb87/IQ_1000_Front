/** @type {import('tailwindcss').Config} */
export default {
  // En v4 no necesitas `content` si usas la integración por defecto.
  theme: {
    extend: {
      colors: {
        brand: {
          green: '#10b981',
          greenDark: '#059669',
        },
        // grises usados en el HTML
        gray900: '#111827',
        gray800: '#1f2937',
        gray700: '#374151',
        gray600: '#4b5563',
        page: '#f9fafb',
      },
      boxShadow: {
        header: '0 1px 3px 0 rgba(0,0,0,0.1)',
        card: '0 10px 15px -3px rgba(0,0,0,0.1), 0 4px 6px -2px rgba(0,0,0,0.05)',
        cardHover:
          '0 20px 25px -5px rgba(0,0,0,0.1), 0 10px 10px -5px rgba(0,0,0,0.04)',
      },
    },
  },
};
