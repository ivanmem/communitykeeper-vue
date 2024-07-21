import { IAlbumItem } from "@/store/vk/IAlbumItem";
import { useVk } from "@/store/vk/vk";
import { AlbumsPreviewSizesInitial } from "@/pages/Albums/consts";
import { computed, MaybeRefOrGetter, ref, toValue, watch } from "vue";
import { useCurrentPhoto } from "@/pages/Album/useCurrentPhoto";
import { useScreenSpinner } from "@/shared/composables/useScreenSpinner";
import { useSizesColumns } from "@/shared/composables/useSizesColumns";
import { toStr } from "@/shared/helpers/toStr";
import { useGroups } from "@/store/groups/groups";
import { useHistory } from "@/store/history/history";
import { toNumberOrUndefined } from "@/shared/helpers/toNumberOrUndefined";
import { IPhoto, IPhotoKey } from "@/store/groups/types";
import { PhotoHelper } from "@/shared/helpers/PhotoHelper";
import { errorToString } from "@/shared/helpers/errorToString";
import { useGridArray } from "@/shared/composables/useGridArray";
// @ts-ignore
import { VList } from "virtua/vue";
import { useApp } from "@/store/app/app";

const countOneLoad = 150;

export function useAlbum(
  ownerIdGetter: MaybeRefOrGetter<number | string>,
  albumIdGetter: MaybeRefOrGetter<number | string>,
  photoIdGetter: MaybeRefOrGetter<number | string | undefined>,
) {
  const appStore = useApp();
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
  const endIndex = ref<number>(0);
  const position = computed<number>(() =>
    Math.min(+(album.value?.size ?? 0), endIndex.value + gridItems.value),
  );
  const albumRef = ref<InstanceType<typeof VList>>();
  const { sizes, gridItems } = useSizesColumns(
    albumRef,
    AlbumsPreviewSizesInitial,
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
  const photos = useGridArray<IPhoto>(gridItems);
  const albumCount = computed(
    () =>
      toNumberOrUndefined(album.value?.size) ??
      (isLoadAllPhotos ? photos.items.length : `${photos.items.length}+`),
  );

  useScreenSpinner(() => !isInit.value);

  const onMoreLoad = () => {
    if (isLoadingPhotos.value) {
      return;
    }

    // защищаем от переполнения
    if (
      photosMaxItems.value - photos.items.length < 1000 &&
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
  } = useCurrentPhoto(
    photos,
    photosMap,
    photoId,
    ownerId,
    isLoadingPhotos,
    isInit,
    onMoreLoad,
  );

  const onClearPhotos = () => {
    photos.clear();
    photosMap.value.clear();
    endIndex.value = 0;
    photosMaxItems.value = countOneLoad;
    isLoadAllPhotos.value = false;
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
    const offset = photos.items.length;
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

      // подгружаем превью только в том случае, если пользователь не открыл фото
      // if (currentPhoto.value == null && appStore.isVkCom) {
      //   await Promise.all(
      //     items.map((item) => {
      //       const size = PhotoHelper.getPreviewSize(item.sizes, sizes.value);
      //       return prefetchPhotoFromUrl(size?.url)?.catch((e) => e);
      //     }),
      //   );
      // }

      for (let newPhoto of items) {
        newPhoto.__state = {
          index: photos.items.length,
        };
        photosMap.value.set(
          PhotoHelper.getPhotoKey(newPhoto.owner_id, newPhoto.id),
          newPhoto,
        );
        photos.push(newPhoto);
      }
    } catch (ex: any) {
      screenError.value = errorToString(ex);
    }
    isInit.value = true;
    isLoadingPhotos.value = false;
  };

  const onScrollerUpdate = (_: number, endRowIndex: number) => {
    endIndex.value = gridItems.value * endRowIndex;
    if (endIndex.value + countOneLoad / 3 < photosMaxItems.value) {
      return;
    }

    onMoreLoad();
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
    } из ${albumCount.value})`;
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
          albumRef.value?.scrollToIndex(
            Math.floor(photo.value.__state.index / gridItems.value),
          );
        } else if (!screenError.value) {
          onMoreLoad();
        }
      }
    },
    { immediate: true, deep: true },
  );

  return {
    photos,
    album,
    albumCount,
    currentPhoto,
    currentPhotoIndex,
    setCurrentPhotoId,
    setCurrentPhotoIndex,
    isInit,
    isLoadingPhotos,
    screenError,
    onScrollerUpdate,
    onSwitchPhoto,
    albumRef,
    gridItems,
    isLoadAllPhotos,
    sizes,
    position,
  };
}
