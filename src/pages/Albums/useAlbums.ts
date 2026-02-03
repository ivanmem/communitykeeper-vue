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
import { useApp } from "@/store/app/app";

const countOneLoad = 100;

export function useAlbums(ownerIdGetter: MaybeRefOrGetter<number | string>) {
  const groupsStore = useGroups();
  const vkStore = useVk();
  const appStore = useApp();
  const ownerId = computed(() => toValue(ownerIdGetter));

  const isInit = ref(false);
  useScreenSpinner(() => !isInit.value);
  const albumsMaxItems = ref(0);
  const isLoadingAlbums = ref(false);
  const group = ref<IGroup | undefined>();
  const staticAlbums = computed(() => getStaticAlbums(ownerId.value));
  const staticAlbumsCount = ref(0);
  const totalCount = ref<number | undefined>(undefined);
  const gallery = useGalleryComponent<IAlbumItem>(AlbumsPreviewSizesInitial);

  const screenError = ref<any>();
  const previewPreloader = useImagePreloader({
    max: () => gallery.columns.value * 4,
  });

  const isAllLoaded = computed(() => {
    if (totalCount.value === undefined) {
      return false;
    }

    const gridItemsCount = gallery.grid.items.length;
    const staticCount = staticAlbumsCount.value;
    const loadedCount = gridItemsCount - staticCount;
    const total = totalCount.value;

    return loadedCount >= total;
  });

  const { setLastScrollTop } = useScrollRestore(
    () => gallery.componentRef.value?.$el,
  );

  watch(ownerId, onOwnerIdChange, { immediate: true });

  watch(albumsMaxItems, onAlbumsMaxItemsChange, { immediate: true });

  watch(gallery.endIndex, onEndIndexChange);

  const loadAllAlbums = appStore.wrapLoading(async () => {
    if (isAllLoaded.value || isLoadingAlbums.value) {
      return;
    }

    while (!isAllLoaded.value) {
      albumsMaxItems.value += countOneLoad;

      // Ждём завершения загрузки текущей порции
      if (isLoadingAlbums.value || !isAllLoaded.value) {
        await new Promise<void>((resolve) => {
          const stop = watch(isLoadingAlbums, (loading) => {
            if (!loading) {
              stop();
              resolve();
            }
          });
        });
      }
    }
  });

  function onClearComponent(): void {
    isInit.value = false;
    isLoadingAlbums.value = false;
    gallery.clear();
    albumsMaxItems.value = 0;
    group.value = undefined;
    screenError.value = undefined;
    totalCount.value = undefined;
    setLastScrollTop(undefined);
  }

  function onScrollerUpdate(): void {
    if (!gallery.componentRef.value) {
      return;
    }

    if (gallery.endIndex.value + countOneLoad / 3 < albumsMaxItems.value) {
      return;
    }

    albumsMaxItems.value += countOneLoad;
  }

  function preloadNextPreviews(): void {
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
  }

  async function onOwnerIdChange(): Promise<void> {
    onClearComponent();

    if (+ownerId.value < 0) {
      try {
        group.value = await groupsStore.getGroupByIdOrLoad(-ownerId.value);
      } catch {}

      try {
        const apiService = await vkStore.getApiService();

        // Сначала получаем общее количество альбомов
        const initialFetch = await apiService.getAlbums({
          owner_id: ownerId.value,
          count: 0,
        });

        // Для групп PhotosGetAlbums.count может не учитывать все системные альбомы,
        // поэтому берем максимум между ним и счетчиком группы.
        totalCount.value = Math.max(
          initialFetch.count,
          group.value?.counters?.albums ?? 0,
        );

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
  }

  async function onAlbumsMaxItemsChange(): Promise<void> {
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
        const result = await apiService.getAlbums({
          owner_id: ownerId.value,
          offset,
          count,
        });

        gallery.grid.push(...result.items);

        // Обновляем totalCount только если он не был задан или если API вернул больше
        if (result.count > (totalCount.value ?? 0)) {
          totalCount.value = result.count;
        }
      } catch (ex: any) {
        if (ex?.errorInfo && ex.errorInfo.error_code !== 15) {
          screenError.value = errorToString(ex);
          console.warn("Необработанная ошибка:", ex.errorInfo);
        }
      }
    }

    isLoadingAlbums.value = false;
    isInit.value = true;
  }

  function onEndIndexChange(endIndex: number, prevIndex: number): void {
    if (prevIndex >= endIndex) {
      return;
    }

    preloadNextPreviews();
  }

  return {
    componentRef: gallery.componentRef,
    sizes: gallery.sizes,
    columns: gallery.columns,
    isInit,
    group,
    albums: gallery.grid,
    previewPreloader,
    onScrollerUpdate,
    screenError,
    isAllLoaded,
    loadAllAlbums,
  };
}
