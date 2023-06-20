import {
  ComponentPublicInstance,
  computed,
  MaybeRefOrGetter,
  onUnmounted,
  reactive,
  ref,
  toValue,
  watchEffect,
} from "vue";

/** @description Возвращает максимальное количество колонок у контейнеря*/
export function useCountGridColumns(
  containerOrInstanceComponent: MaybeRefOrGetter<
    HTMLElement | { $el: ComponentPublicInstance["$el"] } | undefined
  >,
  widthOneColumn: MaybeRefOrGetter<number>,
  containerIndent = 0
) {
  const count = ref(0);
  const unsubs: (() => any)[] = reactive([]);
  const el = computed<HTMLElement | undefined>(() => {
    const elOrComponent = toValue(containerOrInstanceComponent);
    if (!elOrComponent) {
      return undefined;
    }

    return "$el" in elOrComponent ? elOrComponent.$el : elOrComponent;
  });

  const updateCount = () => {
    if (!el.value) {
      return;
    }

    let { clientWidth } = el.value;
    clientWidth -= containerIndent;
    if (clientWidth > 0) {
      count.value = Math.floor(clientWidth / toValue(widthOneColumn));
    } else {
      count.value = 0;
    }
  };

  watchEffect(() => {
    updateCount();
    const element = el.value;
    if (!element) {
      return;
    }

    element.addEventListener("resize", updateCount);
    unsubs.push(() => {
      element.removeEventListener("resize", updateCount);
    });
  });

  onUnmounted(() => {
    unsubs.forEach((x) => {
      try {
        x();
      } catch {}
    });
  });

  return count;
}
