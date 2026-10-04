import { AlbumsPreviewSizesInitial } from "@/pages/Albums/consts";
import { computed, ref, watch } from "vue";
import { useCurrentPhoto } from "@/pages/Album/useCurrentPhoto";
import { useScreenSpinner } from "@/shared/composables/useScreenSpinner";
import { toStr } from "@/shared/helpers/toStr";
import { useGroups } from "@/store/groups/groups";
import { useHistory } from "@/store/history/history";
import { toNumberOrUndefined } from "@/shared/helpers/toNumberOrUndefined";
import { IPhoto, IPhotoKey } from "@/store/groups/types";
import { PhotoHelper } from "@/shared/helpers/PhotoHelper";
import { useGalleryPreviewPreloader } from "@/shared/composables/useGalleryPreviewPreloader";
import { useScrollRestore } from "@/shared/composables/useScrollRestore";
import { useGalleryComponent } from "@/shared/composables/useGalleryComponent";
import { useAlbumPagination } from "@/pages/Album/composables/useAlbumPagination";
import { useAlbumInfo } from "@/pages/Album/composables/useAlbumInfo";
import { useDirectPhoto } from "@/pages/Album/composables/useDirectPhoto";
import { useGalleryInfiniteScroll } from "@/shared/composables/useGalleryInfiniteScroll";
import { provideAlbumContext, injectAlbumPageContext } from "@/pages/Album/stores";

const countOneLoad = 150;

export function useAlbum() {
  const { ownerId, albumId: albumIdRaw, photoId } = injectAlbumPageContext()!;

  const photosMap = ref<Map<IPhotoKey, IPhoto>>(new Map());
  const screenError = ref<any>();

  const historyStore = useHistory();
  const groupsStore = useGroups();

  // Обработка "wall" -> -7
  const albumId = computed(() => {
    const value = albumIdRaw.value;
    return value == "wall" ? -7 : value;
  });

  const gallery = useGalleryComponent<IPhoto>(AlbumsPreviewSizesInitial);

  const pagination = useAlbumPagination({
    ownerId,
    albumId,
    galleryGrid: gallery.grid,
    photosMap: photosMap.value,
    countOneLoad,
  });

  const albumInfo = useAlbumInfo(ownerId, albumId);

  // Прямое фото (загруженное по ID из URL, если его нет в списке)
  const directPhoto = useDirectPhoto(ownerId, photoId, photosMap);

  const photo = computed(() =>
    photosMap.value.get(
      PhotoHelper.getPhotoKeyOrUndefined(ownerId.value, photoId.value) ??
        ("" as IPhotoKey),
    ),
  );

  const albumSize = computed(
    () =>
      pagination.totalCount.value ??
      toNumberOrUndefined(albumInfo.album.value?.size) ??
      (pagination.isAllLoaded.value
        ? gallery.grid.items.length
        : `${gallery.grid.items.length}+`),
  );

  const albumHistoryItem = computed(() =>
    historyStore.getViewAlbum(ownerId.value, albumId.value),
  );

  const albumIsEmpty = computed(() =>
    typeof albumSize.value === "string"
      ? gallery.grid.items.length === 0
      : albumSize.value === 0,
  );

  useScreenSpinner(() => !pagination.isInit.value);

  const {
    currentPhoto,
    currentPhotoIndex,
    setCurrentPhotoIndex,
    setCurrentPhotoId,
    onSwitchPhoto,
    imagePreloader,
  } = useCurrentPhoto(
    gallery.albumPhotoRef,
    gallery.grid,
    photosMap,
    photoId,
    ownerId,
    pagination.isLoading,
    pagination.isInit,
    pagination.loadNext,
    directPhoto.photo,
  );

  provideAlbumContext({ currentPhoto });

  // Пока открыто фото, миниатюры не предзагружаем
  const previewPreloader = useGalleryPreviewPreloader(gallery, () =>
    Boolean(currentPhoto.value),
  );

  const { setLastScrollTop } = useScrollRestore(
    () => gallery.componentRef.value?.$el,
  );

  // Обновление заголовка истории
  watch([albumHistoryItem, albumInfo.album, currentPhotoIndex], () => {
    if (
      !albumHistoryItem.value ||
      !albumInfo.album.value ||
      currentPhotoIndex.value === undefined
    ) {
      return;
    }

    albumHistoryItem.value.subtitle = `${albumInfo.album.value.title} (${
      currentPhotoIndex.value + 1
    } из ${albumSize.value})`;
  });

  // Инициализация и смена альбома
  watch([ownerId, albumId], onAlbumChange, { immediate: true, flush: "sync" });

  // Ошибки загрузки показываем на экране
  watch(
    () => pagination.error.value ?? albumInfo.error.value,
    onLoadError,
    { immediate: true },
  );

  // Смена порядка сортировки
  watch(() => groupsStore.config.reverseOrder, onReverseOrderChange);

  // Навигация к фото
  watch([photoId, pagination.isLoading, directPhoto.isLoading], onNavigateToPhoto, {
    immediate: true,
  });

  useGalleryInfiniteScroll(gallery.el, pagination);

  async function onAlbumChange() {
    screenError.value = undefined;
    pagination.reset();
    albumInfo.reset();
    directPhoto.reset();
    setLastScrollTop(undefined);

    albumInfo.load();
    // Сначала грузим фото из URL, чтобы показать его, не дожидаясь списка
    await directPhoto.load();
    pagination.loadNext();
  }

  function onLoadError(error: string | undefined) {
    if (error) {
      screenError.value = error;
    }
  }

  function onReverseOrderChange() {
    screenError.value = undefined;
    pagination.reset();
    pagination.loadNext();
  }

  function onNavigateToPhoto() {
    if (
      !toStr(photoId.value).length ||
      pagination.isLoading.value ||
      directPhoto.isLoading.value
    ) {
      return;
    }

    if (photo.value !== undefined && photo.value.__state.index >= 0) {
      gallery.componentRef.value?.scrollToIndex(
        Math.floor(photo.value.__state.index / gallery.columns.value),
      );
    } else if (!screenError.value && !directPhoto.photo.value) {
      // Фото задано, но его нет в списке - вдруг оно дальше, подгружаем ещё
      pagination.loadNext();
    }
  }

  return {
    componentRef: gallery.componentRef,
    albumPhotoRef: gallery.albumPhotoRef,
    sizes: gallery.sizes,
    position: gallery.position,
    photos: gallery.grid,
    imagePreloader,
    previewPreloader,
    album: albumInfo.album,
    albumSize,
    albumIsEmpty,
    currentPhotoIndex,
    setCurrentPhotoId,
    setCurrentPhotoIndex,
    isInit: pagination.isInit,
    isLoadingPhotos: pagination.isLoading,
    isLoadingDirectPhoto: directPhoto.isLoading,
    directPhoto: directPhoto.photo,
    screenError,
    onSwitchPhoto,
  };
}
