import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tailwindcss from "@tailwindcss/vite";
import path from "path";
import { reactClickToComponent } from "vite-plugin-react-click-to-component";

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    reactClickToComponent(),
    tailwindcss(),
  ],
  server: {
    proxy: {
      "/api": {
        target: "http://localhost:3000",
        changeOrigin: true,
      },
    },
  },
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
      "@hyperframes/core/runtime/lottie-readiness": path.resolve(__dirname, "node_modules/@hyperframes/core/dist/runtime/adapters/lottieReadiness.js"),
    },
  },
});
