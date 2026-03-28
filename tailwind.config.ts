import type { Config } from "tailwindcss";

const config: Config = {
  darkMode: ["class"],
  content: [
    "./pages/**/*.{js,ts,jsx,tsx,mdx}",
    "./components/**/*.{js,ts,jsx,tsx,mdx}",
    "./app/**/*.{js,ts,jsx,tsx,mdx}",
  ],
  theme: {
    fontFamily: {
      sans: ["var(--font-dm-sans)", "ui-sans-serif", "system-ui", "sans-serif"],
    },
    extend: {
      colors: {
        playbook: {
          black: "#0A0A0A",
          /* Pistachio accent */
          green: "#B2D6B8",
          "green-strong": "#8FC49A",
          surface: "#F6F5F1",
          line: "#E8E6E0",
          muted: "#5C5C5C",
          amber: "#C27A2C",
        },
      },
      maxWidth: {
        app: "480px",
      },
      borderRadius: {
        rh: "12px",
      },
    },
  },
  plugins: [],
};

export default config;
