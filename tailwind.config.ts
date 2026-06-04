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
        navy: {
          50: "#E8EDF2",
          100: "#C5D0DB",
          200: "#9DAFC1",
          300: "#748EA6",
          400: "#4D6E8C",
          500: "#2E5270",
          600: "#1E3A54",
          700: "#152B40",
          800: "#0D1B2A",
          900: "#080F18",
          950: "#040810",
        },
        gold: {
          50: "#FDF8EC",
          100: "#F9EEC9",
          200: "#F3DC93",
          300: "#ECC85D",
          400: "#E3B32A",
          500: "#C9A84C",
          600: "#A8861A",
          700: "#7D6314",
          800: "#52420D",
          900: "#292107",
        },
        surface: "#111827",
        "surface-2": "#1A2535",
        "surface-3": "#243040",
      },
      fontFamily: {
        display: ["var(--font-playfair)", "Georgia", "serif"],
        sans: ["var(--font-dm-sans)", "system-ui", "sans-serif"],
      },
      backgroundImage: {
        grain: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3CfeColorMatrix type='saturate' values='0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)' opacity='0.04'/%3E%3C/svg%3E\")",
      },
      keyframes: {
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        fadeUp: {
          "0%": { opacity: "0", transform: "translateY(8px)" },
          "100%": { opacity: "1", transform: "translateY(0)" },
        },
        slideIn: {
          "0%": { transform: "translateX(100%)" },
          "100%": { transform: "translateX(0)" },
        },
      },
      animation: {
        shimmer: "shimmer 2s linear infinite",
        fadeUp: "fadeUp 0.4s ease-out forwards",
        slideIn: "slideIn 0.3s ease-out forwards",
      },
    },
  },
  plugins: [],
};

export default config;
