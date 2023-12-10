import { defineStore } from "pinia";
import { VKAPI } from "vkontakte-api";
import bridge, {
  MobileUpdateConfigData,
  MVKUpdateConfigData,
  VKUpdateConfigData,
} from "@vkontakte/vk-bridge";
import { chunkString } from "@/helpers/chunkString";
import { watch } from "vue";
import { useGroups } from "@/store/groups/groups";
import { IRequestConfig } from "vkontakte-api/dist/types/shared";
import { sleep } from "@/helpers/sleep";
import { PhotosGetAlbums } from "@/store/vk/IAlbumItem";
import { MAX_SIZE_ONE_VK_VALUE } from "@/common/consts";
import { useUnmounted } from "@/composables/useUnmounted";

export type WebAppConfig = Partial<
  MobileUpdateConfigData & MVKUpdateConfigData & VKUpdateConfigData
>;

interface VkState {
  api?: VKAPI;
  webAppConfig: WebAppConfig;
  chunksMaxCount: number;
  vkWebAppStorageSetCount: number;
  token?: {
    access_token: string;
  };
  appId: number;
}

export const useVk = defineStore("vk", {
  state: (): VkState => {
    return {
      chunksMaxCount: 20, // можно получить не более десяти за 1 запрос
      vkWebAppStorageSetCount: 0,
    };
  },
  actions: {
    async initDynamicResize() {
      if (!bridge.supports("VKWebAppResizeWindow")) {
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

      let unmounted = useUnmounted();
      let sizeLastChanged = 0;

      const updateConfig = () => {
        if (unmounted.value || !vkStore.webAppConfig) {
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
    // init выполняется в app onMounted, поэтому в нём должен срабатывать onUnmounted при размонтировании приложения
    async init() {
      const vkStore = useVk();
      try {
        bridge.subscribe((e) => {
          if (
            e.detail.type === "VKWebAppUpdateConfig" ||
            e.detail.type === "VKWebAppGetConfigResult"
          ) {
            vkStore.webAppConfig = e.detail.data;
            return;
          }
        });

        await bridge.send("VKWebAppInit");
        await vkStore.initDynamicResize();
        await vkStore.initVk();
      } catch (ex) {
        console.error("init vk store", ex);
      }
    },
    async initVk() {
      const vkStore = useVk();
      try {
        vkStore.token = await bridge.send("VKWebAppGetAuthToken", {
          scope: "groups",
          app_id: vkStore.appId,
        });
        vkStore.api = new VKAPI({
          rps: 3,
          accessToken: vkStore.token.access_token,
          lang: "ru",
          v: "5.131",
          isBrowser: true,
        });
      } catch (ex) {
        console.warn(
          "Ошибка при получении токена. Запущена повторная попытка.",
          ex,
        );
        window.alert(
          "Приложение не может получить данные с групп без разрешения 'groups'. Предоставьте разрешение для продолжения работы.",
        );
        await vkStore.initVk();
      }
    },
    getChunkSplitter() {
      return "__";
    },
    getChunkKey(key: string, index: number) {
      return `${key}${this.getChunkSplitter()}${index}`;
    },
    /** @description Получить все значения по указанным ключам в виде словаря */
    async getVkStorageDict<T extends object = Record<any, any>>(
      keys: string[],
    ) {
      const result = await this.sendVKWebAppStorageGet({ keys });
      return result.keys.reduce(
        (dict, { key, value }) => {
          try {
            dict[key] = value.length ? JSON.parse(value) : undefined;
          } catch {}
          return dict;
        },
        {} as Record<string, T | undefined>,
      );
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
    async getVkStorage(key: string) {
      const keys: string[] = [];
      for (let i = 0; i < this.chunksMaxCount; i++) {
        keys.push(this.getChunkKey(key, i));
      }
      const result = await this.sendVKWebAppStorageGet({ keys });
      const chunks: string[] = [];

      const chunkSplitter = this.getChunkSplitter();
      const getIndexBySplitKey = (splitKey: string) => {
        return +splitKey.substring(key.length + chunkSplitter.length);
      };

      const sortComparer = (x: { key: string }, y: { key: string }) => {
        const xIndex = getIndexBySplitKey(x.key);
        const yIndex = getIndexBySplitKey(y.key);
        return xIndex - yIndex;
      };

      for (const { value } of result.keys.sort(sortComparer)) {
        if (value === "") {
          // при встрече первого пустого - останавливаемся. Только один будет гарантированно пуст, он и последний. В остальных могут быть старые значения.
          break;
        }

        chunks.push(value);
      }

      result.keys.forEach((x) => x.value);
      if (key === "groups") {
        this.setSpaceUsed(chunks.length);
      }

      const compressData = chunks.join("");
      return compressData; //await decompressStr(compressData);
    },
    async setVkStorage(key: string, value: string) {
      const chunks = chunkString(value, MAX_SIZE_ONE_VK_VALUE);
      // проходим на один больше, чтобы последний чанк был пустой
      for (let i = 0; i < chunks.length + 1; i++) {
        let chunk = chunks[i];
        const data = {
          key: this.getChunkKey(key, i),
          value: chunk ?? "",
        };
        await this.sendVKWebAppStorageSet(data);
      }

      if (key === "groups") {
        this.setSpaceUsed(chunks.length);
      }
    },
    sendVKWebAppStorageSet(data: { key: string; value: string }) {
      this.vkWebAppStorageSetCount++;
      return bridge.send("VKWebAppStorageSet", data);
    },
    sendVKWebAppStorageGet(data: { keys: string[] }) {
      return bridge.send("VKWebAppStorageGet", data);
    },
    setSpaceUsed(chunksCount: number) {
      useGroups().spaceUsed = +(
        chunksCount === 0 ? 0 : chunksCount / (this.chunksMaxCount * 0.01)
      ).toFixed(0);
    },
    async addRequestToQueue<P extends {} = any, R = any>(
      config: IRequestConfig<P>,
    ): Promise<R> {
      try {
        return await useVk().api!.addRequestToQueue<P, R>(config);
      } catch (ex: any) {
        console.warn("api error", { config, ex });
        if (ex?.errorInfo?.error_code === 6) {
          await sleep(2000);
          // костыль для игнорирования Too many requests per second
          return await useVk().addRequestToQueue<P, R>(config);
        } else {
          throw ex;
        }
      }
    },
    getAlbums(
      owner_id: number | string,
      offset: number | undefined = undefined,
      count: number | undefined = undefined,
    ): Promise<PhotosGetAlbums> {
      return this.addRequestToQueue({
        method: "photos.getAlbums",
        params: {
          owner_id,
          need_system: 1,
          need_covers: 1,
          photo_sizes: 1,
          offset,
          count,
        },
      });
    },
  },
  getters: {
    appId() {
      return +this.webAppConfig.app_id;
    },
  },
});
