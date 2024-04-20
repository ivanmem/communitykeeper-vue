import {
  computed,
  MaybeRefOrGetter,
  onMounted,
  onUnmounted,
  reactive,
  ref,
  toValue,
  watch,
} from "vue";
import { unrefElement, useElementSize, useWindowSize } from "@vueuse/core";
import { useActivated } from "@/composables/useActivated";
import { useApp } from "@/store/app/app";

/** @description Возвращает максимальное количество колонок у контейнера и расширяет sizes, если остаётся свободное место */
export function useSizesColumns(
  maybeElement: MaybeRefOrGetter,
  initialSizes: MaybeRefOrGetter<{ width: number; height: number }>,
  containerIndent = 0,
) {
  const isActivated = useActivated();
  const windowSize = useWindowSize();
  const gridItems = ref(0);
  const unsubs: (() => any)[] = reactive([]);
  const el = computed(() => {
    return unrefElement(maybeElement) as HTMLElement | undefined;
  });
  const { width: elWidth } = useElementSize(el);
  const sizes = ref({ ...toValue(initialSizes) });
  const appStore = useApp();

  // при каждом изменении ширины контейнера - сбрасываем размер столбца до первоначального значения
  watch(
    elWidth,
    () => {
      sizes.value.width = toValue(initialSizes).width;
    },
    { immediate: true, flush: "sync" },
  );
  // при каждом изменении изначальных размеров - сбрасываем размер столбца до первоначального значения
  watch(
    initialSizes,
    () => {
      sizes.value = { ...toValue(initialSizes) };
    },
    { immediate: true, flush: "sync" },
  );

  watch(
    () => sizes.value.width,
    (newWidth, prevWidth) => {
      const height = sizes.value.height;
      const percent = newWidth / prevWidth;
      sizes.value.height = Math.round(height * percent);
    },
    { flush: "sync" },
  );

  const updateCount = () => {
    if (!el.value) {
      return;
    }
    let { clientWidth } = el.value;
    clientWidth -= containerIndent;
    if (clientWidth <= 0) {
      return;
    }
    const newValue = Math.round(clientWidth / toValue(sizes.value.width));
    if (newValue === gridItems.value) {
      return;
    }

    gridItems.value = newValue;
  };

  // при изменении ширины контейнера или изменении количества столбцов или переключении полноэкранного режима - добавляем к ширине столбца свободный размер, чтобы заполнить всю ширину контейнера
  watch(
    [elWidth, gridItems, isActivated, () => appStore.isFullScreen],
    ([elWidth, gridItems]) => {
      if (!el.value || !isActivated.value) {
        return;
      }

      const freeWidth =
        elWidth - gridItems * sizes.value.width - containerIndent;
      const fixWidthOnly = freeWidth / gridItems;
      if (fixWidthOnly <= 0) {
        return;
      }

      const newWidthColumn = sizes.value.width + fixWidthOnly;
      if (newWidthColumn < toValue(initialSizes).width * 1.5) {
        sizes.value.width = newWidthColumn;
      }
    },
    { immediate: true, flush: "post" },
  );

  watch(
    el,
    () => {
      updateCount();
      const element = el.value;
      if (!element) {
        return;
      }

      element.addEventListener("resize", updateCount);
      document.documentElement.addEventListener(
        "fullscreenchange",
        updateCount,
      );
      unsubs.push(() => {
        element.removeEventListener("resize", updateCount);
        document.documentElement.removeEventListener(
          "fullscreenchange",
          updateCount,
        );
      });
    },
    { flush: "post" },
  );

  onUnmounted(() => {
    unsubs.forEach((x) => {
      try {
        x();
      } catch {}
    });
  });

  onMounted(() => {
    const interval = setInterval(() => updateCount(), 100);
    return () => clearInterval(interval);
  });

  return { sizes, gridItems };
}
