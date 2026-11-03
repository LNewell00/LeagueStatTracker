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
          red: "#eb0029",       // Iconic Riot Games Red
          redHover: "#c80023",  // Hover state
          redDark: "#99001a",   // Deep crimson accent
          redLight: "#ff3354",
          black: "#0a0c10",     // Analytics carbon black
          darkest: "#0e1117",   // Terminal background
          dark: "#141822",      // Elevated panels
          surface: "#1a1f2c",   // High-contrast surface
          card: "#1e2433",      // Analytical data card
          border: "#2b3244",    // Grid dividing rules
          borderSubtle: "#1f2432",
          blue: "#1e64b4",      // League Esports Blue (Order)
          gold: "#c89b3c",      // Hextech Gold
          win: "#10b981",       // Trading green
          loss: "#ef4444",      // Trading red
        },
      },
      borderRadius: {
        none: "0px",
        sm: "2px",
        DEFAULT: "4px",
        md: "6px",
        lg: "8px",
      },
      boxShadow: {
        subtle: "0 1px 2px 0 rgba(0, 0, 0, 0.08)",
        panel: "0 1px 3px 0 rgba(0, 0, 0, 0.25), 0 1px 2px -1px rgba(0, 0, 0, 0.25)",
      },
      fontFamily: {
        sans: [
          "-apple-system",
          "BlinkMacSystemFont",
          "'Segoe UI'",
          "Roboto",
          "Inter",
          "sans-serif",
        ],
        mono: [
          "'JetBrains Mono'",
          "'SF Mono'",
          "Menlo",
          "Consolas",
          "monospace",
        ],
      },
    },
  },
  plugins: [],
}
