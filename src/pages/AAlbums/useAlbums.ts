import { computed, MaybeRefOrGetter, ref, toValue, watch } from "vue";
import { IAlbumItem } from "@/store/vk/IAlbumItem";
import { IGroup } from "@/store/groups/types";
import { useGroups } from "@/store/groups/groups";
import {
  AlbumsPreviewSizesInitial,
  getStaticAlbums,
  wallAlbumStatic,
} from "@/pages/AAlbums/consts";
import { useVk } from "@/store/vk/vk";
import { useSizesColumns } from "@/composables/useSizesColumns";
import { useScreenSpinner } from "@/composables/useScreenSpinner";
import { useScrollRestore } from "@/composables/useScrollRestore";
import { errorToString } from "@/helpers/errorToString";
// @ts-ignore
import { VList } from "virtua/vue";
import { useGridArray } from "@/composables/useGridArray";

const countOneLoad = 100;

export function useAlbums(ownerIdGetter: MaybeRefOrGetter<number | string>) {
  const groupsStore = useGroups();
  const vkStore = useVk();
  const ownerId = computed(() => toValue(ownerIdGetter));
  const isInit = ref(false);
  useScreenSpinner(() => !isInit.value);
  const albumsMaxItems = ref(0);
  const isLoadingAlbums = ref(false);
  const group = ref<IGroup | undefined>();
  const staticAlbums = computed(() => getStaticAlbums(ownerId.value));
  const staticAlbumsCount = ref(0);
  const albumsRef = ref<InstanceType<typeof VList>>();
  const { sizes, gridItems } = useSizesColumns(
    albumsRef,
    AlbumsPreviewSizesInitial,
  );
  const albums = useGridArray<IAlbumItem>(gridItems);
  const screenError = ref<any>();

  useScrollRestore(() => albumsRef.value?.$el);

  const onClearComponent = () => {
    isInit.value = false;
    isLoadingAlbums.value = false;
    albums.clear();
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
        try {
          const wallAlbum = await vkStore.createAlbumItem({
            title: wallAlbumStatic.title,
            album_id: wallAlbumStatic.id,
            owner_id: +ownerId.value,
          });
          albums.push(wallAlbum);
          staticAlbumsCount.value = 1;
        } catch {
          albums.push(...staticAlbums.value);
          staticAlbumsCount.value = staticAlbums.value.length;
        }
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
      const offset = albums.items.length - staticAlbumsCount.value;
      const count = albumsMaxItems.value - offset - staticAlbumsCount.value;
      if (count > 0) {
        try {
          const { items } = await vkStore.getAlbums(
            ownerId.value,
            offset,
            count,
          );
          albums.push(...items);
        } catch (ex: any) {
          if (ex?.errorInfo && ex.errorInfo.error_code !== 15) {
            screenError.value = errorToString(ex);
            console.warn("Необработанная ошибка:", ex.errorInfo);
          }
        }
      }

      isLoadingAlbums.value = false;
      isInit.value = true;
    },
    { immediate: true },
  );

  const onScrollerUpdate = (_: number, endRowIndex: number) => {
    const endIndex = gridItems.value * endRowIndex;
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
    sizes,
  };
}
