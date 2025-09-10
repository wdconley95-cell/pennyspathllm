import type { Config } from 'tailwindcss'

const config: Config = {
  darkMode: ["class"],
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      colors: {
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        // Penny's Path theme colors
        brand: {
          DEFAULT: "#E35C4A", // Coral/orange accent
          50: "#FEF2F0",
          100: "#FDE4E0",
          200: "#FBCDC6",
          300: "#F8ABA0",
          400: "#F47D69",
          500: "#E35C4A",
          600: "#D44A35",
          700: "#B23B29",
          800: "#943426",
          900: "#7C3024",
        },
        ink: {
          DEFAULT: "#2C2C2C",
          50: "#F8F8F8",
          100: "#F0F0F0",
          200: "#DCDCDC",
          300: "#BDBDBD",
          400: "#989898",
          500: "#7C7C7C",
          600: "#656565",
          700: "#525252",
          800: "#464646",
          900: "#2C2C2C",
        },
        sand: {
          DEFAULT: "#F7F4F2",
          50: "#FEFDFB",
          100: "#F7F4F2",
          200: "#F0EBE7",
          300: "#E8E0DA",
          400: "#DDD2C9",
          500: "#D1C3B7",
          600: "#C2B0A1",
          700: "#A89689",
          800: "#8B7A6B",
          900: "#6B5C50",
        },
        stone: {
          DEFAULT: "#EDEAE7",
          50: "#F9F8F6",
          100: "#EDEAE7",
          200: "#E0DBD6",
          300: "#D1CAC3",
          400: "#BEB5AB",
          500: "#A99D90",
          600: "#948575",
          700: "#7A6F61",
          800: "#645A4F",
          900: "#524940",
        },
        // Penny's flower colors
        penny: {
          coral: "#E35C4A",
          teal: "#4A9D9C",
          yellow: "#F4C430",
          pink: "#F2A6A6",
          cream: "#FAF6F0",
        }
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
        "fade-in": {
          from: { opacity: "0", transform: "translateY(10px)" },
          to: { opacity: "1", transform: "translateY(0)" },
        },
        "pulse-glow": {
          "0%, 100%": { opacity: "1" },
          "50%": { opacity: "0.5" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
        "fade-in": "fade-in 0.3s ease-out",
        "pulse-glow": "pulse-glow 2s ease-in-out infinite",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
