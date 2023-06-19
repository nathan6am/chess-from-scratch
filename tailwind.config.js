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
        elevation: {
          0: "#0e0e0e",
          1: "#181818",
          2: "#222222",
          3: "#333333",
          4: "#404040",
          5: "#4d4d4d",
          6: "#595959",
          7: "#666666",
        },
        light: {
          100: "#DDDDDD",
          200: "#BDBDBD",
          300: "#959595",
          400: "#6E6E6E",
        },
        gold: {
          100: "#FFD77D",
          200: "#DCB96A",
          300: "#AA8A3F",
          400: "#7B632B",
        },
        success: {
          300: "#8cc998",
          400: "#74bd82",
          500: "#5fb16d",
          600: "#56a263",
          700: "#4c9057",
        },
        danger: {
          300: "#e46b64",
          400: "#eb493d",
          500: "#ee381c",
          600: "#e02c1d",
        },
      },
    },
  },
  plugins: [
    require("tailwind-scrollbar-hide"),
    require("tailwind-scrollbar")({ nocompatible: true }),
  ],
};
