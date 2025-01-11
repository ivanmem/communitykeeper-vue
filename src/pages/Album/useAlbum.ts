import { IAlbumItem } from "@/store/vk/IAlbumItem";
import { useVk } from "@/store/vk/vk";
import { AlbumsPreviewSizesInitial } from "@/pages/Albums/consts";
import { computed, MaybeRefOrGetter, ref, toValue, watch } from "vue";
import { useCurrentPhoto } from "@/pages/Album/useCurrentPhoto";
import { useScreenSpinner } from "@/shared/composables/useScreenSpinner";
import { toStr } from "@/shared/helpers/toStr";
import { useGroups } from "@/store/groups/groups";
import { useHistory } from "@/store/history/history";
import { toNumberOrUndefined } from "@/shared/helpers/toNumberOrUndefined";
import { IPhoto, IPhotoKey } from "@/store/groups/types";
import { PhotoHelper } from "@/shared/helpers/PhotoHelper";
import { errorToString } from "@/shared/helpers/errorToString";
import { useImagePreloader } from "@/shared/composables/useImagePreloader";
import { useScrollRestore } from "@/shared/composables/useScrollRestore";
import { useGalleryComponent } from "@/shared/composables/useGalleryComponent";

const countOneLoad = 150;

export function useAlbum(
  ownerIdGetter: MaybeRefOrGetter<number | string>,
  albumIdGetter: MaybeRefOrGetter<number | string>,
  photoIdGetter: MaybeRefOrGetter<number | string | undefined>,
) {
  const photosMap = ref<Map<IPhotoKey, IPhoto>>(new Map());
  const ownerId = computed(() => toValue(ownerIdGetter));
  const albumId = computed(() => {
    const value = toValue(albumIdGetter);
    return value == "wall" ? -7 : value;
  });
  const photoId = computed(() => toValue(photoIdGetter));
  const photo = computed(() =>
    photosMap.value?.get(
      PhotoHelper.getPhotoKeyOrUndefined(ownerId.value, photoId.value) ??
        ("" as IPhotoKey),
    ),
  );
  const album = ref<IAlbumItem | undefined>();
  const gallery = useGalleryComponent<IPhoto>(AlbumsPreviewSizesInitial);
  const albumSize = computed(
    () =>
      toNumberOrUndefined(album.value?.size) ??
      (isLoadAllPhotos
        ? gallery.grid.items.length
        : `${gallery.grid.items.length}+`),
  );

  const screenError = ref<any>();
  const isInit = ref(false);
  const isLoadingPhotos = ref(false);
  const isLoadAllPhotos = ref(false);
  const photosMaxItems = ref(countOneLoad);
  const historyStore = useHistory();
  const groupsStore = useGroups();
  const vkStore = useVk();
  const albumHistoryItem = computed(() =>
    historyStore.getViewAlbum(ownerId.value, albumId.value),
  );

  const albumIsEmpty = computed(() =>
    typeof albumSize.value === "string"
      ? gallery.grid.items.length === 0
      : albumSize.value === 0,
  );

  useScreenSpinner(() => !isInit.value);

  const onMoreLoad = () => {
    if (isLoadingPhotos.value) {
      return;
    }

    // защищаем от переполнения
    if (
      photosMaxItems.value - gallery.grid.items.length < 1000 &&
      !isLoadAllPhotos.value
    ) {
      photosMaxItems.value += countOneLoad;
    }
  };

  const {
    currentPhoto,
    currentPhotoIndex,
    setCurrentPhotoIndex,
    setCurrentPhotoId,
    onSwitchPhoto,
    imagePreloader,
  } = useCurrentPhoto(
    gallery.grid,
    photosMap,
    photoId,
    ownerId,
    isLoadingPhotos,
    isInit,
    onMoreLoad,
  );
  const previewPreloader = useImagePreloader({
    max: () => gallery.columns.value * 4,
    freeze: () => Boolean(currentPhoto.value),
  });

  const { setLastScrollTop } = useScrollRestore(
    () => gallery.componentRef.value?.$el,
  );

  const onClearPhotos = () => {
    gallery.clear();
    photosMap.value.clear();
    photosMaxItems.value = countOneLoad;
    isLoadAllPhotos.value = false;
    setLastScrollTop(undefined);
  };

  const onClearAlbum = () => {
    album.value = undefined;
  };

  const onClearInit = () => {
    isInit.value = false;
  };

  const onClearError = () => {
    screenError.value = undefined;
  };

  const onUpdateAlbum = async () => {
    const apiService = await vkStore.getApiService();
    album.value = await apiService
      .getCachedAlbum({ owner_id: ownerId.value, album_id: albumId.value })
      .catch((ex) => {
        if (ex?.errorInfo && ex.errorInfo.error_code !== 15) {
          screenError.value = errorToString(ex);
          console.warn("Необработанная ошибка:", ex.errorInfo);
        }

        return undefined;
      });
  };

  const onLoad = async () => {
    const currentPhotosMaxItems = photosMaxItems.value;
    if (
      isLoadingPhotos.value ||
      currentPhotosMaxItems === 0 ||
      isLoadAllPhotos.value
    ) {
      return;
    }

    isLoadingPhotos.value = true;
    screenError.value = undefined;
    const offset = gallery.grid.items.length;
    const count = currentPhotosMaxItems - offset;
    try {
      const apiService = await vkStore.getApiService();
      const { items }: { items: IPhoto[] } = await apiService.photosGet({
        album_id: albumId.value,
        owner_id: ownerId.value,
        offset,
        count,
        rev: groupsStore.config.reverseOrder ? 1 : 0,
        extended: 1,
        photo_sizes: 1,
      });
      if (items.length === 0) {
        isLoadAllPhotos.value = true;
      }

      for (let newPhoto of items) {
        newPhoto.__state = {
          index: gallery.grid.items.length,
        };
        photosMap.value.set(
          PhotoHelper.getPhotoKey(newPhoto.owner_id, newPhoto.id),
          newPhoto,
        );
        gallery.grid.push(newPhoto);
      }
    } catch (ex: any) {
      screenError.value = errorToString(ex);
    }
    isInit.value = true;
    isLoadingPhotos.value = false;
    onScrollerUpdate();
  };

  const onScrollerUpdate = () => {
    if (!gallery.componentRef.value) {
      return;
    }

    if (gallery.endIndex.value + countOneLoad / 3 < photosMaxItems.value) {
      return;
    }

    onMoreLoad();
  };

  const preloadNextPreviews = () => {
    const previewPhotos = gallery.grid.items
      .slice(
        gallery.endIndex.value + gallery.columns.value,
        gallery.endIndex.value + gallery.columns.value * 2,
      )
      .map(
        (photo) =>
          PhotoHelper.getPreviewSize(photo.sizes, gallery.sizes.value)?.url,
      );
    previewPreloader.preloadPhoto(previewPhotos);
  };

  watch([albumHistoryItem, album, currentPhotoIndex], () => {
    if (
      !albumHistoryItem.value ||
      !album.value ||
      currentPhotoIndex.value === undefined
    ) {
      return;
    }

    albumHistoryItem.value.subtitle = `${album.value.title} (${
      currentPhotoIndex.value + 1
    } из ${albumSize.value})`;
  });

  watch(
    [ownerId, albumId],
    async () => {
      onClearInit();
      onClearError();
      onClearPhotos();
      onClearAlbum();
      await onUpdateAlbum();
      await onLoad();
    },
    { immediate: true },
  );

  watch(
    () => groupsStore.config.reverseOrder,
    async () => {
      onClearError();
      onClearPhotos();
      await onLoad();
    },
  );

  watch(photosMaxItems, onLoad, { immediate: true });

  watch(
    [photoId, isLoadingPhotos],
    () => {
      if (toStr(photoId.value).length && !isLoadingPhotos.value) {
        if (photo.value !== undefined) {
          gallery.componentRef.value?.scrollToIndex(
            Math.floor(photo.value.__state.index / gallery.columns.value),
          );
        } else if (!screenError.value) {
          onMoreLoad();
        }
      }
    },
    { immediate: true, deep: true },
  );

  watch(gallery.endIndex, (endIndex, prevIndex) => {
    if (prevIndex >= endIndex) return;
    preloadNextPreviews();
  });

  return {
    componentRef: gallery.componentRef,
    sizes: gallery.sizes,
    position: gallery.position,
    photos: gallery.grid,
    imagePreloader,
    previewPreloader,
    album,
    albumSize,
    albumIsEmpty,
    currentPhoto,
    currentPhotoIndex,
    setCurrentPhotoId,
    setCurrentPhotoIndex,
    isInit,
    isLoadingPhotos,
    screenError,
    onScrollerUpdate,
    onSwitchPhoto,
  };
}
