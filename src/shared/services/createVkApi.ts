import bridge from "@vkontakte/vk-bridge";
import { createRateLimiter } from "@/shared/helpers/createRateLimiter";
import { fromBridgeError } from "@/shared/services/vkApiErrors";

const apiConfig = {
  lang: "ru",
  v: "5.131",
} as const;

export interface VkApiRequest<P extends {} = any> {
  method: string;
  params: P;
}

/**
 * @description Клиент VK API через VKWebAppCallAPIMethod: запросы выполняет клиент VK,
 * поэтому они не ждут в очереди браузера за картинками. Не больше 3 запросов в секунду.
 */
export function createVkApi(accessToken: string) {
  const waitTurn = createRateLimiter(3);

  async function addRequestToQueue<P extends {} = any, R = any>({
    method,
    params,
  }: VkApiRequest<P>): Promise<R> {
    await waitTurn();
    const startedAt = performance.now();

    try {
      const { response } = await bridge.send("VKWebAppCallAPIMethod", {
        method,
        params: {
          ...apiConfig,
          access_token: accessToken,
          ...toBridgeParams(params),
        },
      });
      // Отладочные логи: в прод-сборку не попадают
      if (import.meta.env.DEV) {
        console.log("[VK API]", method, {
          ms: Math.round(performance.now() - startedAt),
          params,
        });
      }

      return response;
    } catch (ex) {
      if (import.meta.env.DEV) {
        console.warn("[VK API]", method, {
          ms: Math.round(performance.now() - startedAt),
          params,
          ex,
        });
      }

      throw fromBridgeError(ex);
    }
  }

  return { addRequestToQueue };
}

// Параметры передаются строками, как раньше в адресе запроса: объекты — в виде JSON
function toBridgeParams(params: object) {
  const result: Record<string, string> = {};
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      continue;
    }

    result[key] = typeof value === "object" ? JSON.stringify(value) : String(value);
  }

  return result;
}
