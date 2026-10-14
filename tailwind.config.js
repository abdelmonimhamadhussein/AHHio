/**@type {import ('tailwindcss').Config} */
module.exports = {
  content: [
    "./index.html",

    "./components/**/*.{js,ts,jsx,tsx}",

    "./src/**/*.{js,ts,jsx,tsx}",
  ],

  theme: {
    colors: {
      black: "#000000",
      white: "#FFFFFF",
      sky: {
        100: "#FFFFFF",
        200: "#000000",
        500: "#0EA5E9",
        600: "#0284C7",
      },
    },

    plugins: [],
  },
};
