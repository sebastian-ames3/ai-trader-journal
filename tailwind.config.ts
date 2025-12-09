import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
    "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    extend: {
      colors: {
        background: "hsl(var(--background))",
        foreground: "hsl(var(--foreground))",
        card: {
          DEFAULT: "hsl(var(--card))",
          foreground: "hsl(var(--card-foreground))",
        },
        popover: {
          DEFAULT: "hsl(var(--popover))",
          foreground: "hsl(var(--popover-foreground))",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        accent: {
          DEFAULT: "hsl(var(--accent))",
          foreground: "hsl(var(--accent-foreground))",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        border: "hsl(var(--border))",
        input: "hsl(var(--input))",
        ring: "hsl(var(--ring))",
        chart: {
          "1": "hsl(var(--chart-1))",
          "2": "hsl(var(--chart-2))",
          "3": "hsl(var(--chart-3))",
          "4": "hsl(var(--chart-4))",
          "5": "hsl(var(--chart-5))",
        },
        // Brand colors
        brand: {
          primary: "hsl(var(--brand-primary))",
          accent: "hsl(var(--brand-accent))",
          "accent-light": "hsl(var(--brand-accent-light))",
        },
        // Semantic colors
        success: {
          DEFAULT: "hsl(var(--success))",
          light: "hsl(var(--success-light))",
        },
        warning: {
          DEFAULT: "hsl(var(--warning))",
          light: "hsl(var(--warning-light))",
        },
        danger: {
          DEFAULT: "hsl(var(--danger))",
          light: "hsl(var(--danger-light))",
        },
        // Mood colors
        mood: {
          confident: "hsl(var(--mood-confident))",
          excited: "hsl(var(--mood-excited))",
          neutral: "hsl(var(--mood-neutral))",
          uncertain: "hsl(var(--mood-uncertain))",
          nervous: "hsl(var(--mood-nervous))",
        },
        // Entry type colors
        type: {
          "trade-idea": "hsl(var(--type-trade-idea))",
          trade: "hsl(var(--type-trade))",
          reflection: "hsl(var(--type-reflection))",
          observation: "hsl(var(--type-observation))",
        },
        // Sentiment colors
        sentiment: {
          positive: "hsl(var(--sentiment-positive))",
          negative: "hsl(var(--sentiment-negative))",
          neutral: "hsl(var(--sentiment-neutral))",
        },
        // Surface colors
        surface: {
          "0": "hsl(var(--surface-0))",
          "1": "hsl(var(--surface-1))",
          "2": "hsl(var(--surface-2))",
          elevated: "hsl(var(--surface-elevated))",
        },
      },
      borderRadius: {
        lg: "var(--radius)",
        md: "calc(var(--radius) - 2px)",
        sm: "calc(var(--radius) - 4px)",
        // Modern border radius
        card: "var(--radius-card)",
        button: "var(--radius-button)",
        pill: "var(--radius-pill)",
        fab: "var(--radius-fab)",
        "2xl": "1rem",
        "3xl": "1.5rem",
      },
      boxShadow: {
        card: "var(--shadow-card)",
        elevated: "var(--shadow-elevated)",
        fab: "var(--shadow-fab)",
        glass: "var(--glass-shadow)",
      },
      backdropBlur: {
        glass: "var(--glass-blur)",
      },
      spacing: {
        safe: "env(safe-area-inset-bottom, 0px)",
        nav: "calc(64px + env(safe-area-inset-bottom, 0px))",
      },
      animation: {
        "success-pop": "success-pop 400ms ease-out",
        "fire-pulse": "fire-pulse 1.5s ease-in-out infinite",
        shimmer: "shimmer 1.5s infinite",
        "slide-up": "slide-up 300ms ease-out",
        "slide-down": "slide-down 300ms ease-out",
        "fade-in": "fade-in 200ms ease-out",
        "fade-out": "fade-out 200ms ease-out",
      },
      keyframes: {
        "success-pop": {
          "0%": { transform: "scale(0.8)", opacity: "0" },
          "50%": { transform: "scale(1.1)" },
          "100%": { transform: "scale(1)", opacity: "1" },
        },
        "fire-pulse": {
          "0%, 100%": { transform: "scale(1)" },
          "50%": { transform: "scale(1.1)" },
        },
        shimmer: {
          "0%": { backgroundPosition: "-200% 0" },
          "100%": { backgroundPosition: "200% 0" },
        },
        "slide-up": {
          from: { transform: "translateY(100%)" },
          to: { transform: "translateY(0)" },
        },
        "slide-down": {
          from: { transform: "translateY(0)" },
          to: { transform: "translateY(100%)" },
        },
        "fade-in": {
          from: { opacity: "0" },
          to: { opacity: "1" },
        },
        "fade-out": {
          from: { opacity: "1" },
          to: { opacity: "0" },
        },
      },
      transitionDuration: {
        "150": "150ms",
        "200": "200ms",
        "300": "300ms",
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
};
export default config;
