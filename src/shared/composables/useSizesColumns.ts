import { computed, MaybeRefOrGetter, ref, toValue, watch } from "vue";
import { unrefElement, useResizeObserver } from "@vueuse/core";

/** @description Возвращает максимальное количество колонок у контейнера и расширяет sizes, если остаётся свободное место */
export function useSizesColumns(
  maybeElement: MaybeRefOrGetter,
  initialSizes: MaybeRefOrGetter<{ width: number; height: number }>,
  containerIndent = 0,
) {
  const columns = ref(0);
  const el = computed(() => {
    return unrefElement(maybeElement) as HTMLElement | undefined;
  });
  const sizes = ref({ ...toValue(initialSizes) });

  watch(
    () => sizes.value.width,
    (newWidth, prevWidth) => {
      const height = sizes.value.height;
      const percent = newWidth / prevWidth;
      sizes.value.height = Math.round(height * percent);
    },
    { flush: "sync" },
  );

  const update = () => {
    if (!el.value) {
      return;
    }
    let { clientWidth } = el.value;
    clientWidth -= containerIndent;
    if (clientWidth <= 0) {
      return;
    }

    // определяем максимальное количество колонок
    const maxColumns = Math.floor(clientWidth / toValue(initialSizes).width);

    // вычисляем ширину колонки, которая обеспечит заполнение всего доступного пространства
    const newColumnWidth = clientWidth / maxColumns;

    // обновляем размеры и количество колонок
    sizes.value.width = newColumnWidth;
    columns.value = maxColumns;
  };

  useResizeObserver(el, update);

  return { sizes, columns };
}
