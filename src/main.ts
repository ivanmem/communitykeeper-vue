import { createApp } from "vue";
import { createPinia } from "pinia";
import { createVuetify } from "vuetify";
import { icons, isDev } from "@/shared/constants/consts";
import Vue3ContextMenu from "@imengyu/vue3-context-menu";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import "vuetify/styles";
import "@/styles/buttons.scss";
import "@vkontakte/vkui/dist/vkui.css";
import "@imengyu/vue3-context-menu/lib/vue3-context-menu.css";
import "@/style.scss";
import App from "@/App.vue";
import { router } from "@/router";

(async () => {
  const vuetify = createVuetify({
    components: isDev ? await import("vuetify/components") : undefined,
    directives: isDev ? await import("vuetify/directives") : undefined,
    icons: {
      defaultSet: "custom",
      aliases: {
        collapse: icons.Icon16LogoVk,
        complete: icons.Icon16LogoVk,
        cancel: icons.Icon16LogoVk,
        close: icons.Icon16LogoVk,
        delete: icons.Icon16LogoVk,
        clear: icons.Icon20Clear,
        success: icons.Icon16LogoVk,
        info: icons.Icon16LogoVk,
        warning: icons.Icon16LogoVk,
        error: icons.Icon16LogoVk,
        prev: icons.Icon16LogoVk,
        next: icons.Icon16LogoVk,
        checkboxOn: icons.Icon24CheckBoxOn,
        checkboxOff: icons.Icon24CheckBoxOff,
        checkboxIndeterminate: icons.Icon24CheckBoxIndeterminate,
        delimiter: icons.Icon16LogoVk,
        sort: icons.Icon16LogoVk,
        expand: icons.Icon16LogoVk,
        menu: icons.Icon16LogoVk,
        subgroup: icons.Icon16LogoVk,
        dropdown: icons.Icon24Dropdown,
        radioOn: icons.Icon16LogoVk,
        radioOff: icons.Icon16LogoVk,
        edit: icons.Icon16LogoVk,
        ratingEmpty: icons.Icon16LogoVk,
        ratingFull: icons.Icon16LogoVk,
        ratingHalf: icons.Icon16LogoVk,
        loading: icons.Icon16LogoVk,
        first: icons.Icon16LogoVk,
        last: icons.Icon16LogoVk,
        unfold: icons.Icon16LogoVk,
        file: icons.Icon16LogoVk,
        plus: icons.Icon16LogoVk,
        minus: icons.Icon16LogoVk,
      },
      sets: {
        custom: {
          ...(icons as any),
        },
      },
    },
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
