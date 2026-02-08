import type { Config } from "tailwindcss";

const config: Config = {
          content: [
                    "./pages/**/*.{ts,tsx}",
                    "./components/**/*.{ts,tsx}",
                    "./app/**/*.{ts,tsx}",
                    "./src/**/*.{ts,tsx}",
          ],
          theme: {
                    container: {
                              center: true,
                              padding: "2rem",
                              screens: {
                                        "2xl": "1400px",
                              },
                    },
                    extend: {
                              fontFamily: {
                                        sans: ["var(--font-kanit)", "var(--font-inter)", "ui-sans-serif", "system-ui"],
                                        heading: ["var(--font-kanit)", "var(--font-anton)", "sans-serif"],
                                        teko: ["var(--font-teko)", "sans-serif"],
                                        kanit: ["var(--font-kanit)", "sans-serif"],
                                        inter: ["var(--font-inter)", "sans-serif"],
                              },
                              colors: {
                                        // Core Theme Colors
                                        border: "hsl(var(--border))",
                                        input: "hsl(var(--input))",
                                        ring: "hsl(var(--ring))",
                                        background: "hsl(var(--background))",
                                        foreground: "hsl(var(--foreground))",

                                        // Semantic Colors
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

                                        // 🥋 The Dojo - Arcade Theme Colors
                                        fighter: {
                                                  red: "#E31E24",
                                                  "red-dark": "#b91c1c",
                                        },
                                        // Cover FB Colors
                                        cover: {
                                                  red: "#E31E24",
                                                  gray: "#808080",
                                                  darkgray: "#6B7280",
                                        },
                                        ink: {
                                                  black: "#000000",
                                        },
                                        golden: {
                                                  DEFAULT: "#f59e0b",
                                                  light: "#fbbf24",
                                        },
                                        paper: {
                                                  white: "#f8fafc",
                                                  cream: "#fefce8",
                                        },
                              },
                              borderRadius: {
                                        lg: "var(--radius)",
                                        md: "calc(var(--radius) - 2px)",
                                        sm: "calc(var(--radius) - 4px)",
                              },
                              boxShadow: {
                                        "arcade": "0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)",
                                        "arcade-lg": "0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05)",
                                        "arcade-red": "0 4px 6px -1px rgba(220, 38, 38, 0.2)",
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
                                        "shake": {
                                                  "0%, 100%": { transform: "translateX(0)" },
                                                  "10%, 30%, 50%, 70%, 90%": { transform: "translateX(-4px)" },
                                                  "20%, 40%, 60%, 80%": { transform: "translateX(4px)" },
                                        },
                                        "flash": {
                                                  "0%, 50%, 100%": { opacity: "1" },
                                                  "25%, 75%": { opacity: "0" },
                                        },
                                        "punch": {
                                                  "0%": { transform: "scale(1)" },
                                                  "50%": { transform: "scale(1.1)" },
                                                  "100%": { transform: "scale(1)" },
                                        },
                              },
                              animation: {
                                        "accordion-down": "accordion-down 0.2s ease-out",
                                        "accordion-up": "accordion-up 0.2s ease-out",
                                        "shake": "shake 0.5s ease-in-out",
                                        "flash": "flash 0.3s ease-in-out",
                                        "punch": "punch 0.2s ease-in-out",
                              },
                    },
          },
          plugins: [require("tailwindcss-animate")],
};

export default config;
