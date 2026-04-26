/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        navy: "#0B1F3B",
        teal: "#0FB9B1",
        emerald: "#1ABC9C",
        canvas: "#F7F9FC",
        border: "#E5E7EB"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        "panel": "0 10px 30px rgba(11,31,59,0.08)"
      }
    }
  },
  plugins: []
};
