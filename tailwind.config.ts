import type { Config } from "tailwindcss";

const config: Config = {
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
    "./lib/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        // French Navy palette
        navy: {
          50:  "#e8edf5",
          100: "#c5d1e3",
          200: "#9aafc9",
          300: "#6f8daf",
          400: "#3a5470",
          500: "#002957",
          600: "#002045",
          700: "#001838",
          800: "#001530",
          900: "#000d1e",
        },
        // Summer Blue accent
        blue: {
          light: "#b3d4e8",
          DEFAULT: "#79ACD2",
          dark: "#4a87b8",
        },
        // Neutral surfaces (light theme)
        ink:   "#0d1f35",
        muted: "#3a5470",
        subtle: "#6b8aaa",
        border: "#dde4ee",
        surface: "#f7f9fc",
        card: "#ffffff",
        // Gold — kept for brand accent pills
        gold: {
          400: "#C9A84C",
          500: "#b8912a",
        },
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        sans:    ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      keyframes: {
        shimmer: {
          "0%":   { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition:  "200% 0" },
        },
        fadeUp: {
          "0%":   { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%":   { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
        fadeUp:  "fadeUp 0.35s ease-out forwards",
        slideIn: "slideIn 0.3s cubic-bezier(0.16,1,0.3,1) forwards",
      },
    },
  },
  plugins: [],
};

export default config;
