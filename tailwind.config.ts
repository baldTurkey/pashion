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
        "color-fantasy": "#F7F3ED",
        "color-rose" : "#DBA1A2",
        "color-vanilla" : "#EFD8D6",
        "color-silver" :"#C2C6B9",
        "color-tobago":"#422B23",
        "color-tobago-70": "rgba(66,43,35,0.7)",
        "color-tobago-40": "rgba(66,43,35,0.4)",
        "color-tobago-15": "rgba(66,43,35,0.15)",
        "color-tobago-08": "rgba(66,43,35,0.08)",
        "color-fantasy-70": "rgba(247,243,237,0.7)",
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
