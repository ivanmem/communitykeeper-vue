import { MaybeRefOrGetter, toValue } from "vue";
import { computed, ref, watch } from "vue/dist/vue";
import { IAlbumItem } from "@/store/vk/IAlbumItem";
import { IGroup } from "@/store/groups/types";
import { useGroups } from "@/store/groups/groups";
import { AlbumsPreviewSizes, getStaticAlbums } from "@/pages/AAlbums/consts";
import { useVk } from "@/store/vk/vk";
import { RecycleScroller } from "vue-virtual-scroller";
import { useCountGridColumns } from "@/hooks/useCountGridColumns";

export function useAlbums(groupIdGetter: MaybeRefOrGetter<number | string>) {
  const groupId = computed(() => toValue(groupIdGetter));
  const isInit = ref(false);
  const albums = ref<IAlbumItem[]>([]);
  const albumsMaxItems = ref(100);
  const isLoadingAlbums = ref(false);
  const group = ref<IGroup | undefined>();
  const staticAlbums = computed(() => getStaticAlbums(groupId.value));
  const albumsRef = ref<InstanceType<typeof RecycleScroller>>();
  const gridItems = useCountGridColumns(
    albumsRef,
    () => AlbumsPreviewSizes.value.width,
    20
  );

  watch(
    groupId,
    async () => {
      group.value = await useGroups().getGroupByIdOrLoad(groupId.value);
    },
    { immediate: true }
  );

  watch(
    [groupId, albumsMaxItems],
    async () => {
      if (isLoadingAlbums.value) {
        return;
      }

      isLoadingAlbums.value = true;
      if (albums.value.length === 0) {
        albums.value.push(...staticAlbums.value);
      }

      const offset = albums.value.length - staticAlbums.value.length;
      const count = albumsMaxItems.value - offset;
      try {
        const { items } = await useVk().getAlbums(groupId.value, offset, count);
        albums.value.push(...items);
      } catch (ex: any) {
        alert(ex.message);
        if (albums.value.length === staticAlbums.value.length) {
          albums.value.length = 0;
        }
      }

      isLoadingAlbums.value = false;
      isInit.value = true;
      albumsRef.value?.updateVisibleItems(true);
    },
    { immediate: true }
  );

  const onScrollerUpdate = (
    startIndex: number,
    endIndex: number,
    visibleStartIndex: number,
    visibleEndIndex: number
  ) => {
    if (endIndex + 50 < albumsMaxItems.value) {
      return;
    }

    albumsMaxItems.value += 100;
  };

  return {
    isInit,
    group,
    albums,
    isLoadingAlbums,
    gridItems,
    onScrollerUpdate,
  };
}
