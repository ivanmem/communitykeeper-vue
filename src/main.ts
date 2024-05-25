import { createApp } from "vue";
import { createPinia } from "pinia";
import { createVuetify } from "vuetify";
import { router } from "@/router";
import { isDev } from "@/common/consts";
import Vue3ContextMenu from "@imengyu/vue3-context-menu";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import "vuetify/styles";
import "@mdi/font/css/materialdesignicons.css";
import "@/styles/icons.scss";
import "@/styles/inputs.scss";
import "@/styles/buttons.scss";
import "@vkontakte/vkui/dist/vkui.css";
import "@imengyu/vue3-context-menu/lib/vue3-context-menu.css";
import "@/style.scss";
import App from "@/App.vue";

(async () => {
  const vuetify = createVuetify({
    icons: {
      defaultSet: "mdi",
    },
    components: isDev ? await import("vuetify/components") : undefined,
    directives: isDev ? await import("vuetify/directives") : undefined,
  });
  try {
    document.documentElement.style.setProperty("background", "black");
    document.documentElement.style.setProperty(
      "--device-pixel-ratio",
      `${window.devicePixelRatio}`,
    );
    const pinia = createPinia();
    pinia.use(piniaPluginPersistedstate);
    const app = createApp(App)
      .use(router)
      .use(pinia)
      .use(Vue3ContextMenu)
      .use(vuetify);
    app.mount("#app");
  } catch (ex: any) {
    console.error("init app", ex);
  }

  // if (isDev) {
  //   try {
  //     const devtools = (await import("@vue/devtools")).default;
  //     devtools.connect("http://localhost", 8098);
  //     console.info("init devtools");
  //   } catch (ex) {
  //     console.error("init devtools", ex);
  //   }
  // }
})();
