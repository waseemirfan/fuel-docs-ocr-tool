import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";

export default defineConfig({
  base: "/fuel-docs-ocr-tool/",
  plugins: [react(), tailwindcss()],
});
