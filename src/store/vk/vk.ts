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
import { IAlbumItem, PhotosGetAlbums } from "@/store/vk/IAlbumItem";
import { IAppInitOptions, useApp } from "@/store/app/app";
import { useDialog } from "@/store/dialog/dialog";
import { toStr } from "@/helpers/toStr";
import { IPhoto } from "@/store/groups/types";
import { VK_STORAGE } from "@/common/consts";

export type WebAppConfig = Partial<
  MobileUpdateConfigData & MVKUpdateConfigData & VKUpdateConfigData
>;

interface VkState {
  api?: VKAPI;
  webAppConfig?: WebAppConfig;
  vkWebAppStorageSetCount: number;
  token?: {
    access_token: string;
  };
  cache: {
    currentAlbum?: IAlbumItem;
  };
}

export const useVk = defineStore("vk", {
  state: (): VkState => {
    return {
      vkWebAppStorageSetCount: 0,
      cache: {},
    };
  },
  actions: {
    async initDynamicResize(opts: IAppInitOptions) {
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
    async init(opts: IAppInitOptions) {
      const vkStore = useVk();
      const dialogStore = useDialog();
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
        await vkStore.initDynamicResize(opts);

        watch(
          () => vkStore.vkWebAppStorageSetCount,
          (count, oldCount) => {
            const warnCount = 200;
            if (oldCount < warnCount && count >= warnCount) {
              dialogStore.alert({
                title: "Внимание, возможна потеря данных!",
                subtitle: `В текущем сеансе данные сохранились уже ${count} раз.
              ВКонтакте позволяет обновлять данные до 1000 раз за час, а уже на 1001 раз отказывает в сохранении.
              В зависимости от количества Ваших групп на одно сохранение может потребоваться несколько запросов.
              В таком случае данные сохранятся не до конца и будут повреждены.
              Если у Вас включено автосохранение, советуем его отключить, либо остановиться вовремя.
              Советуем создать резервную копию на вкладке "Добавить".`,
              });
            }
          },
        );
      } catch (ex) {
        console.error("init vk store", ex);
      }
    },
    async initVk(): Promise<boolean> {
      if (this.api) {
        return true;
      }

      try {
        while (!this.token?.access_token) {
          this.token = await bridge.send("VKWebAppGetAuthToken", {
            scope: "groups",
            app_id: useApp().appId,
          });
        }
        this.api = new VKAPI({
          rps: 3,
          accessToken: this.token!.access_token,
          lang: "ru",
          v: "5.131",
          isBrowser: true,
        });
        return true;
      } catch (ex) {
        console.warn("Ошибка при получении токена.", ex);
        return false;
      }
    },
    getChunkKey(key: string, index: number) {
      return `${key}${VK_STORAGE.chunksSplitter}${index}`;
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
    async getVkStorageObject<T = any, K extends string = string>(key: K): Promise<T | undefined> {
      const dict = await  this.getVkStorageDict({ [key]: Object as T });
      return dict[key] as T | undefined;
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
      for (let i = 0; i < VK_STORAGE.chunksMaxCount; i++) {
        keys.push(this.getChunkKey(key, i));
      }
      const result = await this.sendVKWebAppStorageGet({ keys });
      const chunks: string[] = [];

      const getIndexBySplitKey = (splitKey: string) => {
        return +splitKey.substring(key.length + VK_STORAGE.chunksSplitter.length);
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

      return chunks.join("")
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
              title: "Ошибка при сохранении!",
              subtitle:
                `Часть данных не удалось сохранить, поэтому их целостность может быть повреждена.` +
                `\nНе выходите из приложения и восстановите доступ к интернету или подождите час, после чего нажмите Ок для повторной попытки сохранения.` +
                `В случае, если Вы принимаете на себя риск и не хотите завершать сохранение - нажмите "Отмена", после чего на всякий случай создайте резервную копию.`,
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
    sendVKWebAppStorageSet(data: { key: string; value: string }) {
      this.vkWebAppStorageSetCount++;
      return bridge.send("VKWebAppStorageSet", data);
    },
    sendVKWebAppStorageGet(data: { keys: string[] }) {
      return bridge.send("VKWebAppStorageGet", data);
    },
    async addRequestToQueue<P extends {} = any, R = any>(
      config: IRequestConfig<P>,
    ): Promise<R> {
      const vkStore = useVk();
      try {
        if (!vkStore.api) {
          await this.initVk();
        }

        return await vkStore.api!.addRequestToQueue<P, R>(config);
      } catch (ex: any) {
        console.warn("api error", { config, ex });
        const errorCode = ex?.errorInfo?.error_code;
        if (errorCode === 6) {
          await sleep(2000);
          // костыль для игнорирования Too many requests per second
          return await vkStore.addRequestToQueue<P, R>(config);
        } else if (errorCode === 5) {
          // костыль для повторной авторизации
          await this.initVk();
          return await vkStore.addRequestToQueue<P, R>(config);
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
    async getCachedAlbum(
      owner_id: number | string,
      album_id: number | string,
    ): Promise<IAlbumItem | undefined> {
      const album = this.cache.currentAlbum;
      if (album && album.owner_id == owner_id && album.id == album_id) {
        return this.cache.currentAlbum;
      }

      let response = await this.addRequestToQueue({
        method: "photos.getAlbums",
        params: {
          owner_id,
          album_ids: album_id,
          need_system: 1,
          need_covers: 1,
          photo_sizes: 1,
        },
      });
      this.cache.currentAlbum = await response.items.find(
        (x: IAlbumItem) => x.id == album_id,
      );
      return this.cache.currentAlbum;
    },
    photosGet(params: {
      owner_id: number | string;
      album_id: number | string;
      offset?: number;
      count?: number;
      rev: 1 | 0;
      extended: 1 | 0;
      photo_sizes: 1 | 0;
    }): Promise<{ items: IPhoto[]; count: number }> {
      return this.addRequestToQueue({
        method: "photos.get",
        params,
      });
    },
    async createAlbumItem(params: {
      owner_id: number;
      album_id: number;
      title: string;
    }): Promise<IAlbumItem> {
      const result = await this.photosGet({
        owner_id: params.owner_id,
        album_id: params.album_id,
        count: 1,
        offset: 0,
        rev: 0,
        extended: 0,
        photo_sizes: 1,
      });
      return {
        owner_id: params.owner_id,
        size: result.count,
        title: params.title,
        id: params.album_id,
        sizes: result.items[0]?.sizes,
      };
    },
    copyText(text: any) {
      return bridge.send("VKWebAppCopyText", {
        text: toStr(text),
      });
    },
  },
  getters: {},
});
