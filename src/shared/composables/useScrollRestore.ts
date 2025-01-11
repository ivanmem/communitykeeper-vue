import { onBeforeRouteLeave } from "vue-router";
import { MaybeRefOrGetter, nextTick, onActivated, toValue } from "vue";

/** @description Восстанавливает позицию scrollTop при повторной активации компонента */
export function useScrollRestore(
  elGetter: MaybeRefOrGetter<HTMLElement | undefined>,
) {
  let lastScrollTop: number | undefined = undefined;

  onBeforeRouteLeave(() => {
    lastScrollTop = toValue(elGetter)?.scrollTop;
  });

  onActivated(() => {
    return nextTick(() => {
      const el = toValue(elGetter);
      if (lastScrollTop !== undefined && el) {
        el.scrollTop = lastScrollTop;
      }
    });
  });

  // На случай, если понадобится ручное управление.
  // Например, для сброса сохранённого значения при смене роута.
  function setLastScrollTop(scrollTop: number | undefined) {
    lastScrollTop = scrollTop;
  }

  return {
    setLastScrollTop,
  };
}
