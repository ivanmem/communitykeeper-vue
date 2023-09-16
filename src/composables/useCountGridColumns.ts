import { computed, MaybeRefOrGetter, onMounted, onUnmounted, reactive, Ref, ref, toValue, watch } from "vue";
import { unrefElement, useElementSize } from "@vueuse/core";
import { AlbumsPreviewSizes } from "@/pages/AAlbums/consts";

/** @description Возвращает максимальное количество колонок у контейнера и расширяет widthOneColumn, если остаётся свободное место */
export function useCountGridColumns(
  maybeElement: MaybeRefOrGetter,
  widthOneColumn: Ref<number>,
  initialWidthOneColumn: MaybeRefOrGetter<number>,
  containerIndent = 0,
) {
  const gridItems = ref(0);
  const unsubs: (() => any)[] = reactive([]);
  const el = computed(() => {
    return unrefElement(maybeElement) as HTMLElement | undefined;
  });
  const { width: elWidth } = useElementSize(el);

  const updateCount = () => {
    if (!el.value) {
      return;
    }
    let { clientWidth } = el.value;
    clientWidth -= containerIndent;
    if (clientWidth <= 0) {
      return;
    }
    const newValue = Math.floor(clientWidth / toValue(widthOneColumn));
    if (newValue === gridItems.value) {
      return;
    }

    gridItems.value = newValue;
  };

  // при каждом изменении ширины контейнера - сбрасываем размер столбца до первоначального значения
  watch(
    elWidth,
    () => {
      widthOneColumn.value = toValue(initialWidthOneColumn);
    },
    { immediate: true },
  );

  // при изменении ширины контейнера или изменении количества столбцов - добавляем к ширине столбца свободный размер, чтобы заполнить всю ширину контейнера
  watch(
    [elWidth, gridItems],
    ([elWidth, gridItems]) => {
      if (!el.value) {
        return;
      }

      const freeWidth =
        elWidth - gridItems * AlbumsPreviewSizes.width - containerIndent;
      const fixWidthOnly = freeWidth / gridItems;
      if (fixWidthOnly <= 0) {
        return;
      }

      const newWidthColumn = widthOneColumn.value + Math.floor(fixWidthOnly);
      if (newWidthColumn < toValue(initialWidthOneColumn) * 1.5) {
        widthOneColumn.value = newWidthColumn;
      }
    },
    { immediate: true, flush: "post" },
  );

  watch(el, () => {
    updateCount();
    const element = el.value;
    if (!element) {
      return;
    }

    element.addEventListener("resize", updateCount);
    document.documentElement.addEventListener("fullscreenchange", updateCount);
    unsubs.push(() => {
      element.removeEventListener("resize", updateCount);
      document.documentElement.removeEventListener(
        "fullscreenchange",
        updateCount,
      );
    });
  });

  onUnmounted(() => {
    unsubs.forEach((x) => {
      try {
        x();
      } catch {
      }
    });
  });

  onMounted(() => {
    const interval = setInterval(() => updateCount(), 100);
    return () => clearInterval(interval);
  });

  return gridItems;
}
