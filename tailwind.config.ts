import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./src/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        brand: {
          50: "#f3f0ff",
          100: "#e9e2ff",
          200: "#d4c7ff",
          300: "#b5a0ff",
          400: "#9578ff",
          500: "#7a54f5",
          600: "#5f35d9",
          700: "#4c27b0",
          800: "#3d1f8a",
          900: "#2d1666",
          950: "#1b0d42"
        },
        accent: {
          50: "#fff5ed",
          100: "#ffe8d4",
          200: "#ffcca8",
          300: "#ffa770",
          400: "#ff7e38",
          500: "#ff5e13",
          600: "#f04309",
          700: "#c7300a",
          800: "#9e2810",
          900: "#7f2411"
        },
        ink: {
          900: "#1a1340",
          800: "#251a58",
          700: "#322373",
          600: "#483394",
          500: "#6b5ab7"
        },
        surface: {
          50: "#fafaff",
          100: "#f4f2ff",
          200: "#ebe7fc"
        }
      },
      fontFamily: {
        sans: ["var(--font-inter)", "system-ui", "sans-serif"],
        display: ["var(--font-poppins)", "system-ui", "sans-serif"]
      },
      boxShadow: {
        card: "0 6px 24px -10px rgba(48, 28, 128, 0.12)",
        float: "0 14px 40px -14px rgba(48, 28, 128, 0.22)"
      },
      backgroundImage: {
        "brand-gradient": "linear-gradient(135deg, #4c27b0 0%, #7a54f5 100%)",
        "accent-gradient": "linear-gradient(135deg, #ff7e38 0%, #ff5e13 100%)",
        "logo-gradient": "linear-gradient(135deg, #4c27b0 0%, #ff7e38 100%)"
      }
    }
  },
  plugins: []
};

export default config;
