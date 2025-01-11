import { computed, MaybeRefOrGetter, ref, toRef, toValue, watch } from "vue";
import { IAlbumItem } from "@/store/vk/IAlbumItem";
import { IGroup } from "@/store/groups/types";
import { useGroups } from "@/store/groups/groups";
import {
  AlbumsPreviewSizesInitial,
  getStaticAlbums,
  wallAlbumStatic,
} from "@/pages/Albums/consts";
import { useVk } from "@/store/vk/vk";
import { useScreenSpinner } from "@/shared/composables/useScreenSpinner";
import { useScrollRestore } from "@/shared/composables/useScrollRestore";
import { errorToString } from "@/shared/helpers/errorToString";
import { useImagePreloader } from "@/shared/composables/useImagePreloader";
import { PhotoHelper } from "@/shared/helpers/PhotoHelper";
import { VK_ERROR_CODE } from "@/shared/constants/consts";
import { isVKError } from "vkontakte-api";
import { useGalleryComponent } from "@/shared/composables/useGalleryComponent";

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
  const gallery = useGalleryComponent<IAlbumItem>(AlbumsPreviewSizesInitial);

  const screenError = ref<any>();
  const previewPreloader = useImagePreloader({
    max: () => gallery.columns.value * 4,
  });

  const { setLastScrollTop } = useScrollRestore(
    () => gallery.componentRef.value?.$el,
  );

  const onClearComponent = () => {
    isInit.value = false;
    isLoadingAlbums.value = false;
    gallery.grid.clear();
    albumsMaxItems.value = 0;
    group.value = undefined;
    screenError.value = undefined;
    setLastScrollTop(undefined);
  };

  const onScrollerUpdate = () => {
    if (!gallery.componentRef.value) {
      return;
    }

    if (gallery.endIndex.value + countOneLoad / 3 < albumsMaxItems.value) {
      return;
    }

    albumsMaxItems.value += countOneLoad;
  };

  const preloadNextPreviews = () => {
    const previewPhotos = gallery.grid.items
      .slice(
        gallery.endIndex.value + gallery.columns.value,
        gallery.endIndex.value + gallery.columns.value * 2,
      )
      .map(
        (album) =>
          PhotoHelper.getPreviewSize(album.sizes, gallery.sizes.value)?.url,
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
          gallery.grid.push(wallAlbum);
          staticAlbumsCount.value = 1;
        } catch (ex: any) {
          if (
            isVKError(ex) &&
            ex.errorInfo.error_code === VK_ERROR_CODE.accessDenied &&
            ex.message.endsWith("id blocked")
          ) {
            screenError.value = errorToString(ex);
          } else {
            gallery.grid.push(...staticAlbums.value);
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
      const offset = Math.max(
        0,
        gallery.grid.items.length - staticAlbumsCount.value,
      );
      const count = albumsMaxItems.value - offset - staticAlbumsCount.value;
      if (count > 0) {
        try {
          const apiService = await vkStore.getApiService();
          const { items } = await apiService.getAlbums({
            owner_id: ownerId.value,
            offset,
            count,
          });
          gallery.grid.push(...items);
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

  watch(gallery.endIndex, (endIndex, prevIndex) => {
    if (prevIndex >= endIndex) return;
    preloadNextPreviews();
  });

  return {
    componentRef: gallery.componentRef,
    sizes: gallery.sizes,
    isInit,
    group,
    albums: gallery.grid,
    previewPreloader,
    onScrollerUpdate,
    screenError,
  };
}
