import { VKAPI } from "vkontakte-api";
import { createJsonpSendRequest } from "@/shared/services/createJsonpSendRequest";

const apiConfig = {
  lang: "ru",
  v: "5.131",
} as const;

/** @description Клиент VK API: не больше 3 запросов в секунду */
export function createVkApi(accessToken: string) {
  const vkApi = new VKAPI({ rps: 3, isBrowser: true, accessToken, ...apiConfig });
  vkApi.sendRequest = createJsonpSendRequest({
    baseUrl: vkApi.baseUrl,
    accessToken,
    ...apiConfig,
  });
  return vkApi;
}
