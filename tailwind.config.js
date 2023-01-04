/** @type {import('tailwindcss').Config} */
module.exports = {
  content: ["./pages/**/*.{js,ts,jsx,tsx}", "./components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        google: {
          400: "#e65b51",
          500: "#ea4e38",
          600: "#db4537",
          700: "#c93c31",
          800: "#bc352b",
        },
        facebook: {
          600: "#518ad8",
          700: "#4978c4",
          800: "#4267b2",
          900: "#364a92",
        },
        sepia: "#d4b595",
      },
    },
  },
  plugins: [require("tailwind-scrollbar-hide")],
};
