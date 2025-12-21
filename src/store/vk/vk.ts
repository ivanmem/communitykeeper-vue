import { defineStore } from "pinia";
import { VKAPI } from "vkontakte-api";
import bridge, {
  MobileUpdateConfigData,
  MVKUpdateConfigData,
  VKUpdateConfigData,
} from "@vkontakte/vk-bridge";
import { chunkString } from "@/shared/helpers/chunkString";
import { markRaw, watch } from "vue";
import { useGroups } from "@/store/groups/groups";
import { IAppInitOptions, useApp } from "@/store/app/app";
import { useDialog } from "@/store/dialog/dialog";
import { toStr } from "@/shared/helpers/toStr";
import { VK_STORAGE } from "@/shared/constants/consts";
import { VkApiService } from "@/shared/services/VkApiService";
import { Raw } from "@vue/reactivity";
import { setLocaleFromVk, t } from "@/i18n";

export type WebAppConfig = Partial<
  MobileUpdateConfigData & MVKUpdateConfigData & VKUpdateConfigData
>;

interface VkState {
  apiService?: Raw<VkApiService>;
  webAppConfig?: WebAppConfig;
  vkWebAppStorageSetCount: number;
  token?: {
    access_token: string;
  };
}

export const useVk = defineStore("vk", {
  state: (): VkState => {
    return {
      vkWebAppStorageSetCount: 0,
    };
  },
  actions: {
    copyText(text: any) {
      return bridge.send("VKWebAppCopyText", {
        text: toStr(text),
      });
    },
    async getApiService(): Promise<VkApiService> {
      if (!this.apiService) {
        await this.initVk();
      }
      return this.apiService!;
    },
    getChunkKey(key: string, index: number) {
      return `${key}${VK_STORAGE.chunksSplitter}${index}`;
    },
    async getVkStorage(key: string) {
      const keys: string[] = [];
      for (let i = 0; i < VK_STORAGE.chunksMaxCount; i++) {
        keys.push(this.getChunkKey(key, i));
      }
      const result = await this.sendVKWebAppStorageGet({ keys });
      const chunks: string[] = [];

      const getIndexBySplitKey = (splitKey: string) => {
        return +splitKey.substring(
          key.length + VK_STORAGE.chunksSplitter.length,
        );
      };

      const sortComparer = (x: { key: string }, y: { key: string }) => {
        const xIndex = getIndexBySplitKey(x.key);
        const yIndex = getIndexBySplitKey(y.key);
        return xIndex - yIndex;
      };

      for (const { value } of result.keys.sort(sortComparer)) {
        if (value === "") {
          // При встрече первого пустого - останавливаемся.
          // Только один будет гарантированно пуст, он и последний.
          // В остальных могут быть старые значения.
          break;
        }

        chunks.push(value);
      }

      result.keys.forEach((x) => x.value);
      if (key === "groups") {
        useGroups().setSpaceUsed(chunks.length);
      }

      return chunks.join("");
    },
    /** @description Получить все значения по указанным ключам в виде словаря */
    async getVkStorageDict<T extends object = Record<any, any>>(keys: T) {
      const result = await this.sendVKWebAppStorageGet({
        keys: Object.keys(keys),
      });
      return result.keys.reduce((dict, { key, value }) => {
        try {
          (dict as any)[key] = value.length ? JSON.parse(value) : undefined;
        } catch {}
        return dict;
      }, {} as Partial<T>);
    },
    async getVkStorageObject<T = any, K extends string = string>(
      key: K,
    ): Promise<T | undefined> {
      const dict = await this.getVkStorageDict({ [key]: Object as T });
      return dict[key] as T | undefined;
    },
    async init(opts: IAppInitOptions) {
      const vkStore = useVk();
      const dialogStore = useDialog();
      try {
        // Получаем язык из URL параметров (vk_language)
        const urlParams = new URLSearchParams(window.location.search);
        const vkLanguage = urlParams.get("vk_language");
        if (vkLanguage) {
          setLocaleFromVk(vkLanguage);
        }

        bridge.subscribe((e) => {
          if (e.detail.type === "VKWebAppUpdateConfig") {
            vkStore.webAppConfig = e.detail.data;
            return;
          }
          if (e.detail.type === "VKWebAppGetConfigResult") {
            vkStore.webAppConfig = e.detail.data;
            return;
          }
        });

        await bridge.send("VKWebAppInit");
        await vkStore.initDynamicResize(opts);

        watch(
          () => vkStore.vkWebAppStorageSetCount,
          (count, oldCount) => {
            const warnCount = 200;
            if (oldCount < warnCount && count >= warnCount) {
              dialogStore.alert({
                title: t("storage.dataLossWarningTitle"),
                subtitle: t("storage.dataLossWarningText", { count }),
              });
            }
          },
        );
      } catch (ex) {
        console.error("init vk store", ex);
      }
    },
    async initDynamicResize(opts: IAppInitOptions) {
      if (!(await bridge.supportsAsync("VKWebAppResizeWindow"))) {
        return;
      }

      const vkStore = useVk();
      const resize = () => {
        const webAppConfig = vkStore.webAppConfig;
        if (!webAppConfig) {
          return;
        }

        let { viewport_height: height, viewport_width: width } = webAppConfig;
        if (!width || !height) {
          return;
        }

        // 64 + 64 + 16 + 3
        const frame = 147;
        // 14 + 10 + 80
        const layer = 104;
        height = Math.max(
          500,
          height - (webAppConfig.is_layer ? layer : frame),
        );

        width -= 230;
        return bridge.send("VKWebAppResizeWindow", {
          width,
          height,
        });
      };
      watch(
        [
          () => vkStore.webAppConfig?.viewport_width,
          () => vkStore.webAppConfig?.viewport_height,
        ],
        resize,
        { immediate: true },
      );

      let sizeLastChanged = 0;

      const updateConfig = () => {
        if (opts.unmounted.value || !vkStore.webAppConfig) {
          return;
        }

        const { viewport_height: prevHeight, viewport_width: prevWidth } =
          vkStore.webAppConfig;
        bridge
          .send("VKWebAppGetConfig")
          .then(({ viewport_height, viewport_width }: WebAppConfig) => {
            const sizeChanged =
              prevHeight !== viewport_height || prevWidth !== viewport_width;
            if (sizeChanged) {
              sizeLastChanged = new Date().getTime();
            }

            const recentlyChanged =
              sizeLastChanged > new Date().getTime() - 1000;

            if (recentlyChanged) {
              requestAnimationFrame(updateConfig);
            } else {
              setTimeout(updateConfig, 1000);
            }
          });
      };

      setTimeout(updateConfig);
    },
    async initVk(): Promise<boolean> {
      if (this.apiService) {
        return true;
      }

      try {
        while (!this.token?.access_token) {
          this.token = await bridge.send("VKWebAppGetAuthToken", {
            scope: "groups",
            app_id: useApp().appId,
          });
        }
        const vkApi = new VKAPI({
          rps: 3,
          accessToken: this.token!.access_token,
          lang: "ru",
          v: "5.131",
          isBrowser: true,
        });
        this.apiService = markRaw(new VkApiService(vkApi));
        return true;
      } catch (ex) {
        console.warn(t("errors.tokenError"), ex);
        return false;
      }
    },
    sendVKWebAppStorageGet(data: { keys: string[] }) {
      return bridge.send("VKWebAppStorageGet", data);
    },
    sendVKWebAppStorageSet(data: { key: string; value: string }) {
      this.vkWebAppStorageSetCount++;
      return bridge.send("VKWebAppStorageSet", data);
    },
    async setVkStorage(key: string, value: string) {
      const chunks = chunkString(value, VK_STORAGE.chunkMaxSize);
      // проходим на один больше, чтобы последний чанк был пустой
      for (let i = 0; i < chunks.length + 1; i++) {
        let chunk = chunks[i];
        const data = {
          key: this.getChunkKey(key, i),
          value: chunk ?? "",
        };
        let saved = false;
        while (!saved) {
          try {
            await this.sendVKWebAppStorageSet(data);
            saved = true;
          } catch (e: any) {
            console.warn("Ошибка при сохранении частей данных в VK Storage:", {
              e,
              key,
              value,
            });
            const appStore = useApp();
            appStore.setLoadingPause(true);
            const result = await useDialog().confirm({
              title: t("storage.saveErrorTitle"),
              subtitle: t("storage.saveErrorText"),
            });
            appStore.setLoadingPause(false);
            if (!result) {
              return;
            }
          }
        }
      }

      if (key === "groups") {
        useGroups().setSpaceUsed(chunks.length);
      }
    },
    /** @description Сохранить каждое свойство словаря в отдельном ключе */
    async setVkStorageDict(dataDictArray: Record<string, Record<any, any>>) {
      for (const [key, value] of Object.entries(dataDictArray)) {
        await this.sendVKWebAppStorageSet({
          key,
          value: JSON.stringify(value),
        });
      }
    },
  },
  getters: {},
});
