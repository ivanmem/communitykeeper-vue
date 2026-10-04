import type { ErrorDataAPIError } from "@vkontakte/vk-bridge";
import { isPlainObject } from "es-toolkit";

/** Ошибка, которую вернул VK API: доступ запрещён, слишком много запросов и т.п. */
export class VkApiError extends Error {
  name = "VkApiError";

  constructor(public errorInfo: ErrorDataAPIError) {
    super(errorInfo.error_msg);
  }
}

/** Ошибка доставки запроса: сбой сети или клиента VK */
export class VkTransportError extends Error {
  name = "VkTransportError";
}

/** @description Превращает отказ vk-bridge в ошибку API или ошибку доставки */
export function fromBridgeError(ex: unknown): VkApiError | VkTransportError {
  const errorData = isPlainObject(ex) ? ex.error_data : undefined;
  // Ошибка API приходит в error_data, а на части платформ — внутри error_data.error_reason
  const apiError = [errorData, errorData?.error_reason].find(isApiErrorData);
  if (apiError) {
    return new VkApiError(apiError);
  }

  return new VkTransportError(
    ex instanceof Error ? ex.message : `VK API: ${JSON.stringify(ex)}`,
  );
}

function isApiErrorData(value: unknown): value is ErrorDataAPIError {
  return (
    isPlainObject(value) &&
    typeof value.error_code === "number" &&
    typeof value.error_msg === "string"
  );
}
