/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./pages/**/*.{js,jsx}",
    "./components/**/*.{js,jsx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"],
      },
      colors: {
        ink: "#0E1A1A",
        canvas: "#F6F8F7",
        panel: "#FFFFFF",
        border: "#E4E9E7",
        muted: "#5C6B68",
        primary: {
          DEFAULT: "#0B6E5C",
          dark: "#064E40",
          light: "#E3F3EF",
        },
        gold: {
          DEFAULT: "#C8922B",
          light: "#FBF0DC",
        },
        danger: {
          DEFAULT: "#C3453B",
          light: "#FBEAE8",
        },
        ok: {
          DEFAULT: "#2E9361",
          light: "#E6F5ED",
        },
      },
      boxShadow: {
        card: "0 1px 2px rgba(14,26,26,0.04), 0 1px 10px rgba(14,26,26,0.04)",
      },
      borderRadius: {
        xl2: "14px",
      },
    },
  },
  plugins: [],
};
