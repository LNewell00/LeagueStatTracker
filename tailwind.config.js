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
          darkest: "#090714", // Deep cosmic night
          dark: "#0f0b1f",    // Twilight indigo
          surface: "#16102e", // Astral velvet surface
          card: "#1d153b",    // Radiant card
          border: "#2e2159",  // Starlight border
          accent: "#ec4899",  // Seraphine hot pink
          seraphine: "#f43f85",
          yuumi: "#818cf8",   // Yuumi celestial violet/indigo
          crystal: "#c084fc", // Musical crystal purple
          gold: "#fbbf24",    // Yuumi crown gold
          goldLight: "#fef08a",
        },
        neon: {
          win: "#10b981",    // emerald 500
          winGlow: "#059669",
          winBadge: "#064e3b",
          loss: "#f43f5e",   // rose 500
          lossGlow: "#e11d48",
          lossBadge: "#4c0519",
          active: "#ec4899", // seraphine pink active
        }
      },
      boxShadow: {
        "neon-win": "0 0 15px -3px rgba(16, 185, 129, 0.45)",
        "neon-loss": "0 0 15px -3px rgba(244, 63, 94, 0.45)",
        "neon-cyan": "0 0 20px -3px rgba(236, 72, 153, 0.45)",
        "neon-pink": "0 0 20px -3px rgba(236, 72, 153, 0.5)",
        "neon-yuumi": "0 0 20px -3px rgba(129, 140, 248, 0.5)",
        "neon-gold": "0 0 15px -3px rgba(251, 191, 36, 0.45)",
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

