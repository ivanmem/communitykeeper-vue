import { computed, MaybeRefOrGetter, ref, toRefs, toValue, watch } from "vue";
import { IAlbumItem } from "@/store/vk/IAlbumItem";
import { IGroup } from "@/store/groups/types";
import { useGroups } from "@/store/groups/groups";
import {
  AlbumsPreviewSizes,
  AlbumsPreviewSizesInitial,
  getStaticAlbums,
} from "@/pages/AAlbums/consts";
import { useVk } from "@/store/vk/vk";
import { RecycleScroller } from "vue-virtual-scroller";
import { useCountGridColumns } from "@/composables/useCountGridColumns";
import { useScreenSpinner } from "@/composables/useScreenSpinner";

const countOneLoad = 100;

export function useAlbums(ownerIdGetter: MaybeRefOrGetter<number | string>) {
  const groupsStore = useGroups();
  const ownerId = computed(() => toValue(ownerIdGetter));
  const isInit = ref(false);
  useScreenSpinner(() => !isInit.value);
  const albums = ref<IAlbumItem[]>([]);
  const albumsMaxItems = ref(0);
  const isLoadingAlbums = ref(false);
  const group = ref<IGroup | undefined>();
  const staticAlbums = computed(() => getStaticAlbums(ownerId.value));
  const albumsRef = ref<InstanceType<typeof RecycleScroller>>();
  const initialWidth = computed(() => AlbumsPreviewSizesInitial.value.width);
  const { width: widthOneColumn } = toRefs(AlbumsPreviewSizes);
  const gridItems = useCountGridColumns(
    albumsRef,
    widthOneColumn,
    initialWidth,
  );
  const screenError = ref<any>();

  const onClearComponent = () => {
    isInit.value = false;
    isLoadingAlbums.value = false;
    albums.value.length = 0;
    albumsMaxItems.value = 0;
    group.value = undefined;
    screenError.value = undefined;
  };

  watch(
    ownerId,
    async () => {
      onClearComponent();
      if (+ownerId.value < 0) {
        try {
          group.value = await groupsStore.getGroupByIdOrLoad(-ownerId.value);
        } catch {}
      }

      albumsMaxItems.value = countOneLoad; // это инициирует первую загрузку
    },
    { immediate: true },
  );

  watch(
    albumsMaxItems,
    async () => {
      if (isLoadingAlbums.value || albumsMaxItems.value === 0) {
        return;
      }

      isLoadingAlbums.value = true;
      if (albums.value.length === 0) {
        albums.value.push(...staticAlbums.value);
      }

      const offset = albums.value.length - staticAlbums.value.length;
      const count = albumsMaxItems.value - offset;
      try {
        const { items } = await useVk().getAlbums(ownerId.value, offset, count);
        albums.value.push(...items);
      } catch (ex: any) {
        if (ex?.errorInfo && ex.errorInfo.error_code !== 15) {
          screenError.value = ex;
          console.warn("Необработанная ошибка:", ex.errorInfo);
        }
      }

      isLoadingAlbums.value = false;
      isInit.value = true;
      albumsRef.value?.updateVisibleItems(true);
    },
    { immediate: true },
  );

  const onScrollerUpdate = (
    startIndex: number,
    endIndex: number,
    visibleStartIndex: number,
    visibleEndIndex: number,
  ) => {
    if (endIndex + countOneLoad / 3 < albumsMaxItems.value) {
      return;
    }

    albumsMaxItems.value += countOneLoad;
  };

  return {
    isInit,
    group,
    albums,
    isLoadingAlbums,
    gridItems,
    onScrollerUpdate,
    albumsRef,
    screenError,
  };
}
