import "@/styles/icons.scss";
import "@/styles/variables.scss";
import "@/styles/inputs.scss";
import "@/styles/buttons.scss";
import "@/styles/helpers.scss";
import "@vkontakte/vkui/dist/vkui.css";
import "vue-virtual-scroller/dist/vue-virtual-scroller.css";
import "@imengyu/vue3-context-menu/lib/vue3-context-menu.css";
import "vue3-loading-overlay/dist/vue3-loading-overlay.css";
import "@/style.scss";
import { createApp } from "vue";
import { createPinia } from "pinia";
import { router } from "@/router";
import App from "@/App.vue";
import VueVirtualScroller from "vue-virtual-scroller";
import Vue3ContextMenu from "@imengyu/vue3-context-menu";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";

try {
  document.documentElement.style.setProperty("background", "black");
  const pinia = createPinia();
  pinia.use(piniaPluginPersistedstate);
  const app = createApp(App)
    .use(pinia)
    .use(router)
    .use(VueVirtualScroller)
    .use(Vue3ContextMenu);
  app.mount("#app");
} catch (ex: any) {
  console.error("init app", ex);
}

(async () => {
  if (process.env.NODE_ENV === "development") {
    try {
      const devtools = (await import("@vue/devtools")).default;
      devtools.connect("http://localhost", 8098);
      console.info("init devtools");
    } catch (ex) {
      console.error("init devtools", ex);
    }
  }
})();
