import type { Config } from "tailwindcss";
import defaultTheme from "tailwindcss/defaultTheme";

const config: Config = {
  content: ["./src/app/**/*.{js,ts,jsx,tsx}", "./src/components/**/*.{js,ts,jsx,tsx}"],
  theme: {
    extend: {
      colors: {
        "brand-olive": "#3F4B3B",
        "brand-olive-dark": "#2A332A",
        "brand-cream": "#F5F1E8",
        "brand-blush": "#EADFD6",
        "brand-accent": "#A9647A",
        "brand-ink": "#22261F",
      },
      fontFamily: {
        serif: ["var(--font-serif)", ...defaultTheme.fontFamily.serif],
        sans: ["var(--font-sans)", ...defaultTheme.fontFamily.sans],
      },
    },
  },
  plugins: [],
};

export default config;
