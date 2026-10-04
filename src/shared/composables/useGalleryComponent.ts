import {
  computed,
  MaybeRefOrGetter,
  nextTick,
  onActivated,
  ref,
  toRef,
} from "vue";
import type { VListComponent } from "@/shared/types/VListComponent";
import { useElementSize, useScroll } from "@vueuse/core";
import { useSizesColumns } from "@/shared/composables/useSizesColumns";
import { AlbumsPreviewSizesInitial } from "@/pages/Albums/consts";
import { useGridArray } from "@/shared/composables/useGridArray";
import type AlbumPhoto from "@/pages/Album/AlbumPhoto.vue";

export function useGalleryComponent<T>(
  initialSizes: MaybeRefOrGetter<{ width: number; height: number }>,
) {
  const componentRef = ref<VListComponent>();
  const albumPhotoRef = ref<InstanceType<typeof AlbumPhoto>>();
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

  // Индекс первого элемента верхней видимой строки (по прокрутке)
  const firstVisibleIndex = computed(() => {
    if (!componentRef.value) {
      return 0;
    }

    const topRowIndex = elScrollOffset.value / sizes.value.height;
    const indexScroll = Math.round(columns.value * topRowIndex);
    const remainder = indexScroll % columns.value;
    return Math.round(
      indexScroll - remainder + (remainder > 0 ? columns.value : 0),
    );
  });

  const elSize = useElementSize(el);
  const scrollRows = computed(() => elSize.height.value / sizes.value.height);

  // Количество элементов до нижнего края экрана: индекс следующего за видимыми
  const position = computed<number>(() => {
    const remainder = firstVisibleIndex.value % columns.value;
    const minScreen = scrollRows.value * columns.value;
    const positionScroll =
      firstVisibleIndex.value -
      remainder +
      (remainder > 0 ? columns.value : 0);
    return Math.min(grid.items.length, Math.round(minScreen + positionScroll));
  });

  const clear = () => {
    grid.clear();
    nextTick(() => {
      measure();
    }).then();
  };

  return {
    componentRef,
    albumPhotoRef,
    el,
    elScrollOffset,
    sizes,
    columns,
    grid,
    elSize,
    scrollRows,
    position,
    clear,
  };
}
