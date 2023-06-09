import { defineStore } from "pinia";
import { VKAPI } from "vkontakte-api";
import bridge from "@vkontakte/vk-bridge";
import { chunkString } from "../../helpers/chunkString";
import { watchEffect } from "vue";

interface VkState {
  api?: VKAPI;
  webAppConfig?: Record<string, any>;
}

export const useVk = defineStore("vk", {
  state: (): VkState => {
    return {};
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
        rps: 2,
        accessToken: token.access_token,
        lang: "ru",
        v: "5.122",
        isBrowser: true,
      });
    },
    getChunkKey(key: string, index: number) {
      return `${key}__${index}`;
    },
    async getVkStorage(key: string, maxChunks = 10) {
      const keys: string[] = [];
      for (let i = 0; i < maxChunks; i++) {
        keys.push(this.getChunkKey(key, i));
      }
      const result = await bridge.send("VKWebAppStorageGet", { keys });
      const chunks: string[] = [];
      for (const { value } of result.keys) {
        if (value === "") {
          // при встрече первого пустого - останавливаемся. Только один будет гарантированно пуст, он и последний. В остальных могут быть старые значения.
          break;
        }

        chunks.push(value);
      }

      result.keys.forEach((x) => x.value);
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
        await bridge.send("VKWebAppStorageSet", data);
      }
    },
  },
});
