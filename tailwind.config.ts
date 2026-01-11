import type { Config } from "tailwindcss";

const config: Config = {
          darkMode: ["class"],
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
                              colors: {
                                        // Cyberpunk Theme Colors
                                        border: "hsl(var(--border))",
                                        input: "hsl(var(--input))",
                                        ring: "hsl(var(--ring))",
                                        background: "hsl(var(--background))",
                                        foreground: "hsl(var(--foreground))",

                                        // Neon Colors
                                        neon: {
                                                  cyan: {
                                                            DEFAULT: "#00FFF0",
                                                            50: "#E0FFFD",
                                                            100: "#B3FFFB",
                                                            200: "#80FFF8",
                                                            300: "#4DFFF5",
                                                            400: "#1AFFF2",
                                                            500: "#00FFF0", // Primary
                                                            600: "#00CCB8",
                                                            700: "#009987",
                                                            800: "#006656",
                                                            900: "#003325",
                                                  },
                                                  magenta: {
                                                            DEFAULT: "#FF00FF",
                                                            50: "#FFE0FF",
                                                            100: "#FFB3FF",
                                                            200: "#FF80FF",
                                                            300: "#FF4DFF",
                                                            400: "#FF1AFF",
                                                            500: "#FF00FF", // Accent
                                                            600: "#CC00CC",
                                                            700: "#990099",
                                                            800: "#660066",
                                                            900: "#330033",
                                                  },
                                                  purple: {
                                                            DEFAULT: "#9D00FF",
                                                            50: "#F3E0FF",
                                                            100: "#E0B3FF",
                                                            200: "#CC80FF",
                                                            300: "#B84DFF",
                                                            400: "#A51AFF",
                                                            500: "#9D00FF",
                                                            600: "#7600CC",
                                                            700: "#590099",
                                                            800: "#3B0066",
                                                            900: "#1E0033",
                                                  },
                                        },

                                        // Dark Theme Base
                                        dark: {
                                                  bg: {
                                                            primary: "#0A0A0F", // Deep black-purple
                                                            secondary: "#13131A",
                                                            tertiary: "#1A1A24",
                                                            card: "#1F1F2E",
                                                  },
                                                  text: {
                                                            primary: "#E0E0FF",
                                                            secondary: "#A0A0C0",
                                                            muted: "#60607F",
                                                  },
                                        },

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
                                        "neon-pulse": {
                                                  "0%, 100%": {
                                                            opacity: "1",
                                                            textShadow: "0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor",
                                                  },
                                                  "50%": {
                                                            opacity: "0.8",
                                                            textShadow: "0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor",
                                                  },
                                        },
                                        "glow": {
                                                  "0%, 100%": {
                                                            boxShadow: "0 0 5px currentColor, 0 0 10px currentColor, 0 0 15px currentColor",
                                                  },
                                                  "50%": {
                                                            boxShadow: "0 0 10px currentColor, 0 0 20px currentColor, 0 0 30px currentColor",
                                                  },
                                        },
                                        "slide-in": {
                                                  "0%": { transform: "translateX(-100%)", opacity: "0" },
                                                  "100%": { transform: "translateX(0)", opacity: "1" },
                                        },
                                        "fade-in": {
                                                  "0%": { opacity: "0" },
                                                  "100%": { opacity: "1" },
                                        },
                              },
                              animation: {
                                        "accordion-down": "accordion-down 0.2s ease-out",
                                        "accordion-up": "accordion-up 0.2s ease-out",
                                        "neon-pulse": "neon-pulse 2s ease-in-out infinite",
                                        "glow": "glow 2s ease-in-out infinite",
                                        "slide-in": "slide-in 0.3s ease-out",
                                        "fade-in": "fade-in 0.3s ease-out",
                              },
                              backgroundImage: {
                                        "cyber-grid": "linear-gradient(rgba(0, 255, 240, 0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(0, 255, 240, 0.1) 1px, transparent 1px)",
                                        "gradient-radial": "radial-gradient(var(--tw-gradient-stops))",
                                        "gradient-conic": "conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))",
                              },
                              backgroundSize: {
                                        "cyber-grid": "50px 50px",
                              },
                    },
          },
          plugins: [require("tailwindcss-animate")],
};

export default config;
