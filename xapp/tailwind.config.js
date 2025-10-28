/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      fontFamily: {
        'signature': ['"Pacifico"', 'cursive'], // Nome da fonte
      },
      colors: {
        background: "var(--background)",
        foreground: "var(--foreground)",
        origo: {
          50: "#f8fdff",
          100: "#eefafe",
          200: "#d9f3fb",
          300: "#bfeaf7",
          400: "#8fe0f1",
          500: "#4fcde6",
          600: "#2aa8c9",
          700: "#197489",
          800: "#0f4f56",
          900: "#08282a",
        },
      },
      keyframes: {
        float: {
          "0%": { transform: "translateY(0px)" },
          "50%": { transform: "translateY(-12px)" },
          "100%": { transform: "translateY(0px)" },
        },
        'spin-slow': {
          "0%": { transform: "rotate(0deg)" },
          "100%": { transform: "rotate(360deg)" },
        },
      },
      animation: {
        float: "float 6s ease-in-out infinite",
        "spin-slow": "spin-slow 60s linear infinite",
      },
    },
  },
  plugins: [require('daisyui')]
};
