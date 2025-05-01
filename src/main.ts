import { createApp } from "vue";
import { createPinia } from "pinia";
import { createVuetify } from "vuetify";
import { isDev } from "@/shared/constants/consts";
import Vue3ContextMenu from "@imengyu/vue3-context-menu";
import piniaPluginPersistedstate from "pinia-plugin-persistedstate";
import "vuetify/styles";
import "@/styles/buttons.scss";
import "@vkontakte/vkui/dist/cssm/styles/themes.css";
import "@/styles/vkui.css";
import "@imengyu/vue3-context-menu/lib/vue3-context-menu.css";
import "@/style.scss";
import App from "@/App.vue";
import { router } from "@/router";
import {
  Icon16LogoVk,
  Icon20Clear,
  Icon24ChevronLeftOutline,
  Icon24CheckBoxOn,
  Icon24CheckBoxIndeterminate,
  Icon24ChevronRightOutline,
  Icon24CheckBoxOff,
  Icon24Dropdown,
} from "vue-vkontakte-icons";

(async () => {
  const vuetify = createVuetify({
    components: isDev ? await import("vuetify/components") : undefined,
    directives: isDev ? await import("vuetify/directives") : undefined,
    defaults: {
      VLabel: {},
      VDialog: {
        closeOnBack: true,
        scrim: "black",
      },
      VSwitch: {
        color: "primary",
      },
      global: {
        clearable: true,
      },
    },
    icons: {
      defaultSet: "custom",
      aliases: {
        collapse: Icon16LogoVk,
        complete: Icon16LogoVk,
        cancel: Icon16LogoVk,
        close: Icon16LogoVk,
        delete: Icon16LogoVk,
        clear: Icon20Clear,
        success: Icon16LogoVk,
        info: Icon16LogoVk,
        warning: Icon16LogoVk,
        error: Icon16LogoVk,
        prev: Icon24ChevronLeftOutline,
        next: Icon24ChevronRightOutline,
        checkboxOn: Icon24CheckBoxOn,
        checkboxOff: Icon24CheckBoxOff,
        checkboxIndeterminate: Icon24CheckBoxIndeterminate,
        delimiter: Icon16LogoVk,
        sort: Icon16LogoVk,
        expand: Icon16LogoVk,
        menu: Icon16LogoVk,
        subgroup: Icon16LogoVk,
        dropdown: Icon24Dropdown,
        radioOn: Icon16LogoVk,
        radioOff: Icon16LogoVk,
        edit: Icon16LogoVk,
        ratingEmpty: Icon16LogoVk,
        ratingFull: Icon16LogoVk,
        ratingHalf: Icon16LogoVk,
        loading: Icon16LogoVk,
        first: Icon16LogoVk,
        last: Icon16LogoVk,
        unfold: Icon16LogoVk,
        file: Icon16LogoVk,
        plus: Icon16LogoVk,
        minus: Icon16LogoVk,
      },
      sets: {
        custom: { Icon16LogoVk } as any,
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
})();
