/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{js,ts,jsx,tsx}",
  ],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        riot: {
          darkest: "#070a0e",
          dark: "#0b1017",
          surface: "#121926",
          card: "#182234",
          border: "#23334d",
          accent: "#0ac8b9", // hextech blue/cyan
          gold: "#c89b3c",   // prestige gold
          goldLight: "#f0e6d2",
        },
        neon: {
          win: "#10b981",    // emerald 500
          winGlow: "#059669",
          winBadge: "#064e3b",
          loss: "#f43f5e",   // rose 500
          lossGlow: "#e11d48",
          lossBadge: "#4c0519",
          active: "#38bdf8",  // sky 400
        }
      },
      boxShadow: {
        "neon-win": "0 0 15px -3px rgba(16, 185, 129, 0.45)",
        "neon-loss": "0 0 15px -3px rgba(244, 63, 94, 0.45)",
        "neon-cyan": "0 0 20px -3px rgba(10, 200, 185, 0.45)",
        "neon-gold": "0 0 15px -3px rgba(200, 155, 60, 0.4)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "Oxygen",
          "Ubuntu",
          "Cantarell",
          "sans-serif",
        ],
      },
    },
  },
  plugins: [],
}

