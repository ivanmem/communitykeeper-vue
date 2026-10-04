import type { IRequestConfig, TSendRequest } from "vkontakte-api";
import { validateResponse } from "vkontakte-api/dist/VKAPI/utils";
import { identity, noop } from "es-toolkit";

export interface JsonpSendRequestOptions {
  baseUrl: string;
  accessToken: string;
  v: string;
  lang: string;
  /** Через сколько мс считать запрос зависшим */
  timeout?: number;
}

/** Ошибка доставки запроса: сеть, блокировка скрипта или таймаут */
export class VkTransportError extends Error {
  name = "VkTransportError";
}

let callbackId = 0;

/**
 * @description Замена JSONP-транспорта vkontakte-api.
 * Библиотека вставляет <script> без приоритета, обработки ошибок и таймаута:
 * Chrome ставит такой запрос в очередь за картинками превью, а при сбое сети промис не завершается никогда.
 */
export function createJsonpSendRequest({
  baseUrl,
  accessToken,
  v,
  lang,
  timeout = 30_000,
}: JsonpSendRequestOptions): TSendRequest {
  return <P extends {}, R>(config: IRequestConfig<P>) =>
    new Promise<R>((resolve, reject) => {
      const { method, params, format = identity } = config;
      const callbackName = `__vkapicallback${++callbackId}`;
      const allParams = { v, access_token: accessToken, lang, ...params };
      const script = document.createElement("script");
      const startedAt = performance.now();
      const timer = setTimeout(
        () => fail(`VK API: превышено время ожидания ${method}`),
        timeout,
      );

      Reflect.set(window, callbackName, onResponse);
      script.src = `${baseUrl}/method/${method}?${toQuery(allParams)}&callback=${callbackName}`;
      // Без высокого приоритета запрос ждёт загрузки всех превью в очереди браузера
      script.fetchPriority = "high";
      script.onerror = () => fail(`VK API: не удалось выполнить ${method}`);
      document.head.append(script);

      function onResponse(response: unknown) {
        finish();
        console.log("[VK API]", method, {
          ms: Math.round(performance.now() - startedAt),
          params,
        });

        try {
          resolve(format(validateResponse(response, config), allParams));
        } catch (ex) {
          reject(ex);
        }
      }

      function fail(message: string) {
        finish();
        // Ответ может прийти позже: скрипт вызовет пустой колбэк вместо ошибки
        Reflect.set(window, callbackName, noop);
        console.warn("[VK API]", message, {
          ms: Math.round(performance.now() - startedAt),
          params,
        });
        reject(new VkTransportError(message));
      }

      function finish() {
        clearTimeout(timer);
        script.remove();
        Reflect.deleteProperty(window, callbackName);
      }
    });
}

function toQuery(params: object) {
  const query = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined) {
      continue;
    }

    query.set(key, typeof value === "object" ? JSON.stringify(value) : String(value));
  }

  return query.toString();
}
