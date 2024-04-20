import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import svgLoader from "vite-svg-loader";
import { fileURLToPath, URL } from "url";
import vuetify from "vite-plugin-vuetify";

const isDev = process.env.NODE_ENV === "development";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    hmr: false,
  },
  plugins: [
    vue(),
    vuetify({
      autoImport: !isDev,
      styles: { configFile: "./src/styles/vite.scss" },
    }),
    svgLoader({
      svgo: false,
    }),
  ],
  resolve: {
    alias: [
      {
        find: "@",
        replacement: fileURLToPath(new URL("./src", import.meta.url)),
      },
    ],
  },
  optimizeDeps: {
    esbuildOptions: {
      target: "esnext",
    },
  },
  build: {
    minify: false,
    target: "ES2019",
  },
});
