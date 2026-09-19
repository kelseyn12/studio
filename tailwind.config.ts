import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#14120F",
        panel: "#1E1B17",
        lift: "#2A261F",
        line: "#3D382E",
        mute: "#A89F91",
        paper: "#F6F1E8",
        sun: "#E0B36A",
        idea: "#8E877C",
        script: "#7F9EB5",
        film: "#A392C2",
        edit: "#D4A06A",
        review: "#C48A9A",
        ready: "#E0B36A",
        live: "#8FAE8B",
        data: "#7EA8A6",
      },
      fontFamily: {
        sans: ["var(--font-geist)", "ui-sans-serif", "system-ui"],
      },
      borderRadius: {
        card: "1.25rem",
      },
    },
  },
  plugins: [],
};

export default config;
