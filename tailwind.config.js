/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/**/*.{js,jsx,ts,tsx}", // projenin kaynak dosyaları
  ],
  darkMode: 'class', // Dark mode desteği
  theme: {
    extend: {
      colors: {
        primary: {
          50: "#ebf5ff",
          100: "#d6eaff",
          200: "#add5ff",
          300: "#85c0ff",
          400: "#5caaff",
          500: "#3395ff",  // pastel mavi vurgu
          600: "#287acc",
          700: "#1d5e99",
          800: "#134366",
          900: "#092733",
        },
        neutralGray: {
          50: "#f9fafb",
          100: "#f3f4f6",
          200: "#e5e7eb",
          300: "#d1d5db",
          400: "#9ca3af",
          500: "#6b7280",
          600: "#4b5563",
          700: "#374151",
          800: "#1f2937",
          900: "#111827",
        },
      },
      fontFamily: {
        inter: ['Inter', 'sans-serif'],
      },
      boxShadow: {
        soft: "0 2px 8px rgba(0,0,0,0.1)",
        'soft-dark': "0 2px 8px rgba(0,0,0,0.3)",
      },
      borderRadius: {
        lg: "0.75rem",
      },
      spacing: {
        18: "4.5rem",
        72: "18rem",
        84: "21rem",
        96: "24rem",
      },
      animation: {
        'fade-in': 'fadeIn 0.3s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'bounce-in': 'bounceIn 0.6s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        bounceIn: {
          '0%': { transform: 'scale(0.3)', opacity: '0' },
          '50%': { transform: 'scale(1.05)' },
          '70%': { transform: 'scale(0.9)' },
          '100%': { transform: 'scale(1)', opacity: '1' },
        },
      },
    },
  },
  plugins: [],
}
