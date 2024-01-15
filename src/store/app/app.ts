import { defineStore } from "pinia";
import random from "lodash/random";
import { platform } from "@vkontakte/vkui";
import { Ref, watch } from "vue";
import { setEruda } from "@/helpers/setEruda";
import { useVk } from "@/store/vk/vk";
import { IGroupsConfig, useGroups } from "@/store/groups/groups";
import { imageUrlToBase64 } from "@/helpers/imageUrlToBase64";
import mainUrl from "@/assets/slides/main.png";
import bridge, { ShowSlidesSheetRequest } from "@vkontakte/vk-bridge";
import { toStr } from "@/helpers/toStr";
import { router } from "@/router";

interface AppState {
  caption: string;
  loadingSet: Set<any>;
  platform: "android" | "ios" | "vkcom";
  isFullScreen: boolean;
  urlParams: Record<any, any>;
  config: IAppConfig;
}

export interface IAppConfig {
  eruda?: boolean;
  slides?: boolean;
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
      platform: platform() as any,
      isFullScreen: false,
      urlParams: {},
      config: {
        eruda: false,
        slides: true,
      },
    };
  },
  getters: {
    isLoading(): boolean {
      return this.loadingSet.size !== 0;
    },
    isVkCom(): boolean {
      return this.platform === "vkcom";
    },
    isIos(): boolean {
      return this.platform === "ios";
    },
    isAppIos(): boolean {
      return this.isIos && navigator.userAgent.startsWith("com.vk.vkclient");
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

      watch(
        () => toStr(this.config),
        () => {
          return this.saveCurrentAppConfig();
        },
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
      const id = random(true);
      this.loadingSet.add(id);
      return () => this.loadingSet.delete(id);
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
          title: "Хранитель Групп",
          subtitle:
            "Группы, папки, сортировка, фильтрация, встроенная галерея с историей просмотров. Продолжим?",
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
      } catch (ex) {
        console.error(ex);
      }
    },
  },
});
