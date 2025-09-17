/** @type {import('tailwindcss').Config} */
const config = {
  content: ["./src/**/*.{tsx}"],
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  prefix: "",
  safelist: [
    "lg:col-span-4",
    "lg:col-span-6",
    "lg:col-span-8",
    "lg:col-span-12",
    "border-border",
    "bg-card",
    "border-error",
    "bg-error/30",
    "border-success",
    "bg-success/30",
    "border-warning",
    "bg-warning/30",
  ],
  theme: {
    container: {
      center: true,
      padding: {
        "2xl": "2rem",

        lg: "2rem",
        md: "2rem",
        sm: "1rem",
        xl: "2rem",
      },
      screens: {
        "2xl": "1440px",
        lg: "1024px",
        md: "768px",
        sm: "40rem",
        xl: "80rem",
      },
    },
    extend: {
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },

      colors: {
        accent: {
          DEFAULT: "oklch(var(--accent))",
          foreground: "oklch(var(--accent-foreground))",
        },
        background: "oklch(var(--bg)/1)",
        border: "oklch(var(--border-subtle)/1)",
        card: {
          DEFAULT: "oklch(var(--card)/1)",
          foreground: "oklch(var(--card-foreground)/1)",
        },
        destructive: {
          DEFAULT: "hsl(var(--destructive))",
          foreground: "hsl(var(--destructive-foreground))",
        },
        foreground: "oklch(var(--fg)/1)",
        input: "hsl(var(--input))",
        muted: {
          DEFAULT: "hsl(var(--muted))",
          foreground: "hsl(var(--muted-foreground))",
        },
        popover: {
          DEFAULT: "oklch(var(--popover)/1)",
          foreground: "oklch(var(--popover-foreground)/1)",
        },
        primary: {
          DEFAULT: "hsl(var(--primary))",
          foreground: "hsl(var(--primary-foreground))",
        },
        ring: "hsl(var(--ring))",
        secondary: {
          DEFAULT: "hsl(var(--secondary))",
          foreground: "hsl(var(--secondary-foreground))",
        },
        success: "hsl(var(--success))",
        error: "hsl(var(--error))",
        warning: "hsl(var(--warning))",
      },
      fontFamily: {
        mono: ["var(--font-geist-mono)"],
        sans: ["var(--font-geist-sans)"],
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
      },
      typography: ({ theme }) => ({
        DEFAULT: {
          css: {
            "--tw-prose-body": "var(--text)",
            "--tw-prose-headings": "var(--text)",
            h1: {
              fontSize: "3.5rem",
              fontWeight: "normal",
              marginBottom: "0.25em",
            },
          },
        },
      }),
    },
  },
};

export default config;
