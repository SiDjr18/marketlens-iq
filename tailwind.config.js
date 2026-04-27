/** @type {import('tailwindcss').Config} */
export default {
  content: ["./src/**/*.{ts,tsx,html}"],
  theme: {
    extend: {
      colors: {
        navy: "#0B1F3B",
        teal: "#0FB9B1",
        emerald: "#1ABC9C",
        canvas: "#F6F8FB",
        border: "#DDE5EE",
        ink: "#111827",
        muted: "#6B7280"
      },
      fontFamily: {
        sans: ["Inter", "ui-sans-serif", "system-ui", "sans-serif"]
      },
      boxShadow: {
        "panel": "0 18px 44px rgba(11,31,59,0.10)",
        "soft": "0 8px 24px rgba(15, 35, 65, 0.08)",
        "control": "0 1px 2px rgba(15, 35, 65, 0.06), 0 8px 18px rgba(15, 35, 65, 0.04)"
      }
    }
  },
  plugins: []
};
