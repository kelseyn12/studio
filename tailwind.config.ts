import type { Config } from "tailwindcss";

const config: Config = {
  content: ["./app/**/*.{ts,tsx}", "./components/**/*.{ts,tsx}"],
  theme: {
    extend: {
      colors: {
        ink: "#09090B",
        panel: "#121214",
        lift: "#1A1A1E",
        line: "#2A2A30",
        mute: "#A1A1AA",
        paper: "#FAFAF7",
        sun: "#F5C400",
        idea: "#71717A",
        script: "#60A5FA",
        film: "#A78BFA",
        edit: "#FB923C",
        review: "#F472B6",
        ready: "#F5C400",
        live: "#4ADE80",
        data: "#22D3EE",
      },
      fontFamily: {
        sans: ["var(--font-geist)", "ui-sans-serif", "system-ui"],
      },
    },
  },
  plugins: [],
};

export default config;
