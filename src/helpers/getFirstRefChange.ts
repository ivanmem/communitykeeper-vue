import { Ref, watch, WatchOptions } from "vue";

/** @description Дождаться и получить новое значение из Ref */
export function getFirstRefChange<T = any>(
  value: Ref<T>,
  options?: WatchOptions<false> | undefined,
): Promise<T> {
  let resolve: (value: T | PromiseLike<T>) => void;

  const promise = new Promise<T>((_resolve) => {
    resolve = _resolve;
  });

  const unwatch = watch(
    value,
    () => {
      unwatch();
      resolve(value.value);
    },
    options,
  );

  return promise;
}
