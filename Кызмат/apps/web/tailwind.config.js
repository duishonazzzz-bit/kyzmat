/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,jsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f1f7f4",
          100: "#dbece4",
          200: "#b7d9c8",
          300: "#8cc1a6",
          400: "#5fa47f",
          500: "#3d8564",
          600: "#2f6b52",
          700: "#275543",
          800: "#234439",
          900: "#1f392f"
        },
        accent: {
          500: "#f97316",
          600: "#ea580c"
        }
      },
      fontFamily: {
        sans: ["Manrope", "Segoe UI", "sans-serif"],
        display: ["Space Grotesk", "Segoe UI", "sans-serif"]
      },
      boxShadow: {
        panel: "0 20px 60px -24px rgba(15, 23, 42, 0.35)",
      },
    },
  },
  plugins: [],
};
