import { computed, MaybeRefOrGetter, onActivated, ref, toRef } from "vue";
import type { VList } from "virtua/lib/vue";
import { useElementSize, useScroll } from "@vueuse/core";
import { useSizesColumns } from "@/shared/composables/useSizesColumns";
import { AlbumsPreviewSizesInitial } from "@/pages/Albums/consts";
import { useGridArray } from "@/shared/composables/useGridArray";

export function useGalleryComponent<T>(
  initialSizes: MaybeRefOrGetter<{ width: number; height: number }>,
) {
  const componentRef = ref<InstanceType<typeof VList>>();
  const el = toRef(() => componentRef.value?.$el as HTMLDivElement | undefined);
  const { y: elScrollOffset, measure } = useScroll(el);

  onActivated(() => {
    // без этого elScrollOffset не обновляется
    measure();
  });

  const { sizes, columns } = useSizesColumns(
    componentRef,
    initialSizes ?? AlbumsPreviewSizesInitial,
  );
  const grid = useGridArray<T>(columns);

  const endIndex = computed(() => {
    if (!componentRef.value) {
      return 0;
    }

    const endRowIndex = elScrollOffset.value / sizes.value.height;
    const endIndexScroll = Math.round(columns.value * endRowIndex);
    const remainder = endIndexScroll % columns.value;
    return Math.round(
      endIndexScroll - remainder + (remainder > 0 ? columns.value : 0),
    );
  });

  const elSize = useElementSize(el);
  const scrollRows = computed(() => elSize.height.value / sizes.value.height);

  const position = computed<number>(() => {
    const remainder = endIndex.value % columns.value;
    const minScreen = scrollRows.value * columns.value;
    const positionScroll =
      endIndex.value - remainder + (remainder > 0 ? columns.value : 0);
    return Math.min(grid.items.length, Math.round(minScreen + positionScroll));
  });

  return {
    componentRef,
    el,
    elScrollOffset,
    endIndex,
    sizes,
    columns,
    grid,
    elSize,
    scrollRows,
    position,
  };
}
