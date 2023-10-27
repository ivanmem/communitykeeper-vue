import { PersistedStateOptions } from "pinia-plugin-persistedstate";

/** @description Если у пользователя отключены куки, тогда при использовании localStorage выбрасывается исключение.
 * В таком случае persist не используем и возвращаем undefined. */
export function getPiniaPersist(
  persist:
    | boolean
    | PersistedStateOptions
    | PersistedStateOptions[]
    | undefined,
) {
  try {
    return localStorage && persist;
  } catch {
    return undefined;
  }
}
