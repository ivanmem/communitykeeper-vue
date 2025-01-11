import { computed, MaybeRefOrGetter, ref, toValue, watch } from "vue";
import { IAlbumItem } from "@/store/vk/IAlbumItem";
import { IGroup } from "@/store/groups/types";
import { useGroups } from "@/store/groups/groups";
import {
  AlbumsPreviewSizesInitial,
  getStaticAlbums,
  wallAlbumStatic,
} from "@/pages/Albums/consts";
import { useVk } from "@/store/vk/vk";
import { useSizesColumns } from "@/shared/composables/useSizesColumns";
import { useScreenSpinner } from "@/shared/composables/useScreenSpinner";
import { useScrollRestore } from "@/shared/composables/useScrollRestore";
// @ts-ignore
import { VList } from "virtua/vue";
import { useGridArray } from "@/shared/composables/useGridArray";
import { errorToString } from "@/shared/helpers/errorToString";
import { useImagePreloader } from "@/shared/composables/useImagePreloader";
import { PhotoHelper } from "@/shared/helpers/PhotoHelper";
import { VK_ERROR_CODE } from "@/shared/constants/consts";
import { isVKError } from "vkontakte-api";

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
  const { sizes, columns } = useSizesColumns(
    albumsRef,
    AlbumsPreviewSizesInitial,
  );
  const albums = useGridArray<IAlbumItem>(columns);
  const endIndex = ref<number>(0);
  const screenError = ref<any>();
  const previewPreloader = useImagePreloader({ max: () => columns.value * 4 });

  const { setLastScrollTop } = useScrollRestore(() => albumsRef.value?.$el);

  const onClearComponent = () => {
    isInit.value = false;
    isLoadingAlbums.value = false;
    albums.clear();
    albumsMaxItems.value = 0;
    group.value = undefined;
    screenError.value = undefined;
    setLastScrollTop(undefined);
  };

  const onScrollerUpdate = () => {
    if (!albumsRef.value) {
      return;
    }

    const endRowIndex = Math.round(
      albumsRef.value.scrollOffset / sizes.value.height,
    );
    endIndex.value = columns.value * endRowIndex;
    if (endIndex.value + countOneLoad / 3 < albumsMaxItems.value) {
      return;
    }

    albumsMaxItems.value += countOneLoad;
  };

  const preloadNextPreviews = () => {
    const previewPhotos = albums.items
      .slice(endIndex.value + columns.value, endIndex.value + columns.value * 2)
      .map(
        (album) => PhotoHelper.getPreviewSize(album.sizes, sizes.value)?.url,
      );
    previewPreloader.preloadPhoto(previewPhotos);
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
          const apiService = await vkStore.getApiService();
          const wallAlbum = await apiService.createAlbumItem({
            title: wallAlbumStatic.title,
            album_id: wallAlbumStatic.id,
            owner_id: +ownerId.value,
          });
          albums.push(wallAlbum);
          staticAlbumsCount.value = 1;
        } catch (ex: any) {
          if (
            isVKError(ex) &&
            ex.errorInfo.error_code === VK_ERROR_CODE.accessDenied &&
            ex.message.endsWith("id blocked")
          ) {
            screenError.value = errorToString(ex);
          } else {
            albums.push(...staticAlbums.value);
            staticAlbumsCount.value = staticAlbums.value.length;
          }
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
      const offset = Math.max(0, albums.items.length - staticAlbumsCount.value);
      const count = albumsMaxItems.value - offset - staticAlbumsCount.value;
      if (count > 0) {
        try {
          const apiService = await vkStore.getApiService();
          const { items } = await apiService.getAlbums({
            owner_id: ownerId.value,
            offset,
            count,
          });
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

  watch(endIndex, (endIndex, prevIndex) => {
    if (prevIndex >= endIndex) return;
    preloadNextPreviews();
  });

  return {
    isInit,
    group,
    albums,
    previewPreloader,
    onScrollerUpdate,
    albumsRef,
    screenError,
    sizes,
  };
}
