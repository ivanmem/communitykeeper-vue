import { defineStore } from "pinia";
import { VKAPI } from "vkontakte-api";
import bridge from "@vkontakte/vk-bridge";
import { chunkString } from "@/helpers/chunkString";
import { watchEffect } from "vue";
import { useGroups } from "@/store/groups/groups";
import { IRequestConfig } from "vkontakte-api/dist/types/shared";
import { sleep } from "@/helpers/sleep";

interface VkState {
  api?: VKAPI;
  webAppConfig?: Record<string, any>;
  chunksMaxCount: number;
  vkWebAppStorageSetCount: number;
}

export const useVk = defineStore("vk", {
  state: (): VkState => {
    return {
      chunksMaxCount: 20, // можно получить не более десяти за 1 запрос
      vkWebAppStorageSetCount: 0,
    };
  },
  actions: {
    async init() {
      bridge.subscribe((e) => {
        if (e.detail.type === "VKWebAppUpdateConfig") {
          useVk().webAppConfig = e.detail.data;
          return;
        }
      });

      watchEffect(async () => {
        const webAppConfig = useVk().webAppConfig;
        if (!webAppConfig || !bridge.supports("VKWebAppResizeWindow")) {
          return;
        }

        const { viewport_height: height, viewport_width: width } = webAppConfig;
        if (!width || !height) {
          return;
        }

        await bridge.send("VKWebAppResizeWindow", {
          width,
          height: Math.max(500, height - 200),
        });
      });

      await bridge.send("VKWebAppInit", {});

      const token: any = await bridge.send("VKWebAppGetAuthToken", {
        scope: "groups",
        app_id: 51658481,
      });
      useVk().api = new VKAPI({
        rps: 3,
        accessToken: token.access_token,
        lang: "ru",
        v: "5.131",
        isBrowser: true,
      });
    },
    getChunkSplitter() {
      return "__";
    },
    getChunkKey(key: string, index: number) {
      return `${key}${this.getChunkSplitter()}${index}`;
    },
    /** @description Получить все значения по указанным ключам в виде словаря */
    async getVkStorageDict<T extends object = Record<any, any>>(
      keys: string[]
    ) {
      const result = await this.sendVKWebAppStorageGet({ keys });
      return result.keys.reduce((dict, { key, value }) => {
        try {
          dict[key] = value.length ? JSON.parse(value) : undefined;
        } catch {}
        return dict;
      }, {} as Record<string, T | undefined>);
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
      const compressData = value; // await compressStr(value);
      const chunks = chunkString(compressData);
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
      config: IRequestConfig<P>
    ): Promise<R> {
      try {
        return await useVk().api!.addRequestToQueue<P, R>(config);
      } catch (ex: any) {
        if (ex?.errorInfo?.error_code === 6) {
          await sleep(2000);
          // костыль для игнорирования Too many requests per second
          return await useVk().addRequestToQueue<P, R>(config);
        } else {
          throw ex;
        }
      }
    },
  },
});
