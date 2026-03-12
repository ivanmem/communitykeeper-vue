import { defineConfig } from "vite";
import vue from "@vitejs/plugin-vue";
import svgLoader from "vite-svg-loader";
import { fileURLToPath, URL } from "url";
import vuetify from "vite-plugin-vuetify";

const isDev = process.env.NODE_ENV === "development";

// https://vitejs.dev/config/
export default defineConfig({
  server: {
    hmr: true,
    host: true,
    allowedHosts: true,
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
      {
        find: "@vkontakte/vk-bridge",
        replacement: fileURLToPath(
          new URL(
            "./node_modules/@vkontakte/vk-bridge/dist/index.es.js",
            import.meta.url,
          ),
        ),
      },
    ],
  },
  build: {
    minify: false,
    target: "ES2019",
    rolldownOptions: {
      output: {
        codeSplitting: false,
      },
    },
  },
  define: {
    BUILD_DATE: JSON.stringify(new Date().toISOString()),
  },
});
