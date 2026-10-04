import { computed, MaybeRefOrGetter, toValue } from "vue";
import { refThrottled } from "@vueuse/core";

/**
 * @description Подпись, текст которой обновляется не чаще раза в delay мс, а скрывается сразу.
 * Иначе устаревший текст ещё до delay мс висит на экране, например рядом с ошибкой.
 */
export function useThrottledLabel(
  text: MaybeRefOrGetter<string>,
  hidden: MaybeRefOrGetter<boolean>,
  delay: number,
) {
  const throttledText = refThrottled(
    computed(() => toValue(text)),
    delay,
  );

  return computed(() => (toValue(hidden) ? undefined : throttledText.value));
}
