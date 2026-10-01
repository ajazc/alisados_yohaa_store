/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{vue,js}"],
  theme: {
    extend: {
      colors: {
        // Fondos
        canvas: "#FAFAFA",
        surface: "#FFFFFF",

        // Branding rosa soft / nude
        rose: {
          50: "#FDF5F8",
          100: "#FAE9F1",
          200: "#F5D3E2",
          300: "#EFB6D0",
          400: "#E8A0BF", // Primario solicitado
          500: "#DE83A9",
          600: "#D47AE8", // Acento nude/lila solicitado
          700: "#B75E92",
        },

        // Texto
        ink: {
          DEFAULT: "#1A1A1A",
          soft: "#4A4A4A",
          muted: "#8A8A8A",
        },

        // Accion
        wa: {
          DEFAULT: "#25D366",
          dark: "#1EB855",
          tint: "#E8FBEF",
        },
      },
      fontFamily: {
        sans: [
          "Inter",
          "-apple-system",
          "BlinkMacSystemFont",
          "Segoe UI",
          "Roboto",
          "sans-serif",
        ],
      },
      boxShadow: {
        card: "0 1px 2px rgba(26,26,26,0.04), 0 8px 24px -12px rgba(212,122,232,0.18)",
        bar: "0 -4px 24px -8px rgba(26,26,26,0.14)",
        sheet: "0 -8px 40px -12px rgba(26,26,26,0.22)",
      },
      keyframes: {
        "slide-up": {
          "0%": { transform: "translateY(100%)" },
          "100%": { transform: "translateY(0)" },
        },
        "fade-in": {
          "0%": { opacity: "0" },
          "100%": { opacity: "1" },
        },
        "pop-in": {
          "0%": { transform: "scale(0.9)", opacity: "0" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
      },
      animation: {
        "slide-up": "slide-up 0.28s cubic-bezier(0.22,1,0.36,1)",
        "fade-in": "fade-in 0.2s ease-out",
        "pop-in": "pop-in 0.18s ease-out",
      },
    },
  },
  plugins: [],
};
