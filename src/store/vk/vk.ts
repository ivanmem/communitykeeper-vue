import { defineStore } from "pinia";
import { VKAPI } from "vkontakte-api";
import bridge from "@vkontakte/vk-bridge";
import { chunkString } from "../../helpers/chunkString";

interface VkState {
  api?: VKAPI;
}

export const useVk = defineStore("vk", {
  state: (): VkState => {
    return {};
  },
  actions: {
    async init() {
      const token: any = await bridge.send("VKWebAppGetAuthToken", {
        scope: "groups",
        app_id: 51658481,
      });
      this.api = new VKAPI({
        rps: 3,
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
      console.log({ result });
      const chunks: string[] = [];
      for (const { value } of result.keys) {
        if (value === "") {
          // при встрече первого пустого - останавливаемся. Только один будет гарантированно пуст, он и последний. В остальных могут быть старые значения.
          break;
        }

        chunks.push(value);
      }

      console.log({ chunks });
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
        console.log({ data });
        await bridge.send("VKWebAppStorageSet", data);
      }
    },
  },
});
