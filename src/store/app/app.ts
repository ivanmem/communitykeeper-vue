import { defineStore } from "pinia";
import { Ref, watch } from "vue";
import { setEruda } from "@/shared/helpers/setEruda";
import { useVk } from "@/store/vk/vk";
import { IGroupsConfig, useGroups } from "@/store/groups/groups";
import { imageUrlToBase64 } from "@/shared/helpers/imageUrlToBase64";
import mainUrl from "@/assets/slides/main.png";
import bridge, { ShowSlidesSheetRequest } from "@vkontakte/vk-bridge";
import { toStr } from "@/shared/helpers/toStr";
import { router } from "@/router";
import { watchDebounced } from "@vueuse/core";
import { platform, PlatformType } from "@vkontakte/vkui";
import { type LocaleSetting, setLocale, t } from "@/i18n";
import { type ThemeSetting, applyTheme } from "@/shared/composables/useColorScheme";

interface AppState {
  caption: string;
  loadingSet: Set<any>;
  isLoadingPause: boolean;
  platform: PlatformType;
  isFullScreen: boolean;
  urlParams: Record<any, any>;
  config: IAppConfig;
}

export interface IAppConfig {
  eruda?: boolean;
  slides?: boolean;
  locale?: LocaleSetting;
  theme?: ThemeSetting;
}

export interface IAppConfigs {
  appConfig?: IAppConfig;
  groupsConfig?: IGroupsConfig;
}

export interface IAppInitOptions {
  unmounted: Ref<boolean>;
}

export const useApp = defineStore("app", {
  state(): AppState {
    return {
      caption: "",
      loadingSet: new Set(),
      isLoadingPause: false,
      platform: platform(),
      isFullScreen: false,
      urlParams: {},
      config: {
        eruda: false,
        slides: true,
      },
    };
  },
  getters: {
    os(): "macos" | "windows" | "linux" | "ios" | "android" | undefined {
      if (this.platform === "android") {
        return "android";
      }

      if (this.platform === "ios") {
        return "ios";
      }

      if ("userAgentData" in navigator) {
        const uaData = (navigator as any).userAgentData;
        if (uaData.platform.startsWith("Mac")) {
          return "macos";
        }

        if (uaData.platform.startsWith("Win")) {
          return "windows";
        }

        if (uaData.platform.startsWith("Linux")) {
          return "linux";
        }
      }

      if ("platform" in navigator) {
        if (navigator.platform.startsWith("Mac")) {
          return "macos";
        }

        if (navigator.platform.startsWith("Win")) {
          return "windows";
        }

        if (/Linux|X11/.test(navigator.platform)) {
          return "linux";
        }
      }

      const userAgent = navigator.userAgent;
      if (userAgent.includes("Mac OS")) {
        return "macos";
      }

      if (userAgent.includes("Windows")) {
        return "windows";
      }

      if (userAgent.includes("Linux")) {
        return "linux";
      }

      return undefined;
    },
    isLoading(): boolean {
      return this.loadingSet.size !== 0 && !this.isLoadingPause;
    },
    isVkCom(): boolean {
      return this.platform === "vkcom";
    },
    isAndroid(): boolean {
      return this.platform === "android";
    },
    isIos(): boolean {
      return this.platform === "ios";
    },
    isMacOS(): boolean {
      return this.os === "macos";
    },
    isAppIos(): boolean {
      return this.isIos && this.isApp;
    },
    isAppAndroid(): boolean {
      return this.isAndroid && this.isApp;
    },
    isApp(): boolean {
      return (
        navigator.userAgent.startsWith("com.vk.vkclient") ||
        useVk().webAppConfig?.app === "vkclient"
      );
    },
    appId(): number {
      return +(this.urlParams.vk_app_id ?? 0);
    },
  },
  actions: {
    async init(opts: IAppInitOptions) {
      try {
        this.urlParams = Object.fromEntries(
          new URLSearchParams(location.search),
        );
        const vkStore = useVk();
        const groupsStore = useGroups();
        await vkStore.init(opts);
        const configs = await vkStore.getVkStorageDict({
          appConfig: {} as IAppConfig,
          groupsConfig: {} as IGroupsConfig,
        } satisfies IAppConfigs);
        await this.updateAppConfig(configs.appConfig);
        await groupsStore.updateGroupsConfig(configs.groupsConfig);
        await groupsStore.init(opts);
      } catch (ex: any) {
        console.error("Произошла ошибка при инициализации appStore.", ex);
      }

      watch(
        () => this.config.eruda,
        useApp().wrapLoading(() => {
          return setEruda(Boolean(this.config.eruda));
        }),
        { immediate: this.config.eruda },
      );

      watchDebounced(
        () => toStr(this.config),
        () => {
          return this.saveCurrentAppConfig();
        },
        { debounce: 500 },
      );

      if (this.config.slides) {
        const { action } = await this.initSlides();
        if (action === "confirm") {
          delete this.config.slides;
          await router.push("/about/");
        }
      }
    },
    getLoadingFinisher(): () => void {
      const id = Math.random();
      this.loadingSet.add(id);
      return () => this.loadingSet.delete(id);
    },
    setLoadingPause(pause: boolean) {
      this.isLoadingPause = pause;
    },
    wrapLoading<T = any>(action: (...args: any) => T) {
      return async (...args: any) => {
        const loadingFinisher = useApp().getLoadingFinisher();
        try {
          return await action(...args);
        } finally {
          loadingFinisher();
        }
      };
    },
    async initSlides() {
      const [main] = await Promise.all([imageUrlToBase64(mainUrl)]);
      const slides: ShowSlidesSheetRequest["slides"] = [
        {
          media: {
            blob: main,
            type: "image",
          },
          title: t("welcome.title"),
          subtitle: t("welcome.subtitle"),
        },
      ];
      return await bridge.send("VKWebAppShowSlidesSheet", {
        slides,
      });
    },
    saveCurrentAppConfig() {
      return useVk().setVkStorageDict({
        appConfig: this.config,
      });
    },
    async updateAppConfig(config?: IAppConfig) {
      try {
        config ??= await useVk().getVkStorageObject<IAppConfig>("appConfig");
        // таким нехитрым образом мы убедимся в правильности формата сохранённого конфига
        if (config && config.eruda !== undefined) {
          this.config = config;
        }
        // Применяем сохранённые настройки локали и темы
        setLocale(this.config.locale ?? "system");
        applyTheme(this.config.theme ?? "system");
      } catch (ex) {
        console.error(ex);
      }
    },
  },
});
