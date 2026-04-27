import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  root: "src",
  base: "./",
  plugins: [react()],
  build: {
    outDir: "../",
    emptyOutDir: false,
    modulePreload: false,
    sourcemap: false,
    rollupOptions: {
      output: {
        entryFileNames: "assets/[name]-[hash].js",
        chunkFileNames: "assets/[name]-[hash].js",
        assetFileNames: "assets/[name]-[hash][extname]",
        manualChunks(id) {
          if (!id.includes("node_modules")) return undefined;
          if (id.includes("xlsx")) return "xlsx-worker-fallback";
          if (id.includes("html2canvas") || id.includes("jspdf") || id.includes("dompurify")) return "export-pdf-image";
          if (id.includes("pptxgenjs") || id.includes("jszip")) return "export-ppt";
          return undefined;
        }
      }
    }
  },
  server: {
    port: 4175
  }
});
