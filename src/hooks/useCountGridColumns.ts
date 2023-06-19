import {
  MaybeRefOrGetter,
  onUnmounted,
  reactive,
  ref,
  toValue,
  watchEffect,
} from "vue";

export function useCountGridColumns(
  container: MaybeRefOrGetter<HTMLElement | undefined>,
  width: MaybeRefOrGetter<number>,
  containerIndent = 0
) {
  const count = ref(0);
  const unsubs: (() => any)[] = reactive([]);

  const updateCount = (el: HTMLElement) => {
    let { clientWidth } = el;
    clientWidth -= containerIndent;
    if (clientWidth > 0) {
      count.value = Math.floor(clientWidth / toValue(width));
    } else {
      count.value = 0;
    }
  };

  const resizeListener = () => {
    const el = toValue(container);
    if (!el) {
      return;
    }

    updateCount(el);
  };

  watchEffect(() => {
    resizeListener();
    const el = toValue(container);
    if (!el) {
      return;
    }

    el.addEventListener("resize", resizeListener);
    unsubs.push(() => {
      el.removeEventListener("resize", resizeListener);
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
