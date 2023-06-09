import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import svgLoader from "vite-svg-loader";
import basicSsl from "@vitejs/plugin-basic-ssl";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    https: true,
    hmr: {
      host: "localhost",
    },
  },
  plugins: [vue(), svgLoader(), basicSsl()],
});
