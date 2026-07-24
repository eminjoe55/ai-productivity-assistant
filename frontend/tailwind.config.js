/** @type {import('tailwindcss').Config} */
export default {
  content: ["./index.html", "./src/**/*.{js,ts,jsx,tsx}"],
  darkMode: "class",
  theme: {
    extend: {
      colors: {
        base: {
          DEFAULT: "#0F1417",
          light: "#F6F4EF",
        },
        surface: {
          DEFAULT: "#171E23",
          2: "#1E272D",
          light: "#FFFFFF",
          "light-2": "#EFECE4",
        },
        line: {
          DEFAULT: "#2A363D",
          light: "#DCD7CB",
        },
        ink: {
          DEFAULT: "#E8EDEF",
          muted: "#8A9BA5",
          light: "#20241F",
          "light-muted": "#6B6A5F",
        },
        signal: {
          amber: "#F2A93B",
          cyan: "#4FB6E8",
          green: "#5FBF8B",
          red: "#E2645A",
        },
      },
      fontFamily: {
        display: ["'Space Grotesk'", "sans-serif"],
        body: ["'Inter'", "sans-serif"],
        mono: ["'JetBrains Mono'", "monospace"],
      },
      backgroundImage: {
        grid: "linear-gradient(to right, rgba(138,155,165,0.06) 1px, transparent 1px), linear-gradient(to bottom, rgba(138,155,165,0.06) 1px, transparent 1px)",
      },
      backgroundSize: {
        grid: "24px 24px",
      },
    },
  },
  plugins: [],
};
