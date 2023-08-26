import { IAlbumItem, PhotosGetAlbums } from "@/store/vk/IAlbumItem";
import { useVk } from "@/store/vk/vk";
import { toString } from "lodash";
import {
  AlbumsPreviewSizes,
  AlbumsPreviewSizesInitial,
  getStaticAlbums,
} from "@/pages/AAlbums/consts";
import {
  computed,
  MaybeRefOrGetter,
  nextTick,
  ref,
  toRefs,
  toValue,
  watch,
} from "vue";
import { IPhoto } from "vkontakte-api";
import { useCurrentPhoto } from "@/pages/AAlbum/useCurrentPhoto";
import { useScreenSpinner } from "@/composables/useScreenSpinner";
import { useCountGridColumns } from "@/composables/useCountGridColumns";
import { RecycleScroller } from "vue-virtual-scroller";
import { toStr } from "@/helpers/toStr";
import { useGroups } from "@/store/groups/groups";
import { PhotoHelper } from "@/helpers/PhotoHelper";
import { useActiveElement } from "@vueuse/core";
import { useElementDeviceSize } from "@/composables/useElementDeviceSize";
import { getFirstRefChange } from "@/helpers/getFirstRefChange";

const countOneLoad = 100;

export function useAlbum(
  ownerIdGetter: MaybeRefOrGetter<number | string>,
  albumIdGetter: MaybeRefOrGetter<number | string>,
  photoIdGetter: MaybeRefOrGetter<number | string | undefined>,
) {
  const ownerId = computed(() => toValue(ownerIdGetter));
  const albumId = computed(() => toValue(albumIdGetter));
  const photoId = computed(() => toValue(photoIdGetter));
  const album = ref<IAlbumItem | undefined>();
  const photos = ref<IPhoto[]>([]);
  const albumRef = ref<InstanceType<typeof RecycleScroller>>();
  const { width: widthColumn } = toRefs(AlbumsPreviewSizes);
  const initialWidth = computed(() => AlbumsPreviewSizesInitial.value.width);
  const gridItems = useCountGridColumns(albumRef, widthColumn, initialWidth);
  const groupsStore = useGroups();
  const screenError = ref<any>();
  const isInit = ref(false);
  const isLoadingPhotos = ref(false);
  const isLoadAllPhotos = ref(false);
  const photosMaxItems = ref(0);
  const {
    currentPhoto,
    currentPhotoIndex,
    getPhotoByIndex,
    setCurrentPhotoIndex,
    setCurrentPhotoId,
  } = useCurrentPhoto(photos, photoId, isLoadingPhotos);
  const activeEl = useActiveElement();
  const activeElSize = useElementDeviceSize(activeEl, undefined, {
    box: "border-box",
  });
  const showSwitchPhotoSpinner = ref(false);
  useScreenSpinner(() => !isInit.value || showSwitchPhotoSpinner.value);

  const onClearPhotos = () => {
    photos.value.length = 0;
    photosMaxItems.value = 0;
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
    const albums: PhotosGetAlbums["items"] =
      albumId.value === "wall"
        ? []
        : (
            await useVk()
              .getAlbums(ownerId.value)
              .catch((ex) => {
                if (ex?.errorInfo && ex.errorInfo.error_code !== 15) {
                  screenError.value = ex;
                  console.warn("Необработанная ошибка:", ex.errorInfo);
                }

                return { items: [], count: 0 };
              })
          ).items;
    albums.push(...getStaticAlbums(ownerId.value));
    album.value = albums.find(
      (x) => toString(x.id) === toString(albumId.value),
    );
  };

  const onLoad = () => {
    return nextTick(() => {
      photosMaxItems.value = countOneLoad; // это инициирует первую загрузку
    });
  };

  watch(
    ownerId,
    async () => {
      onClearInit();
      onClearError();
      onClearPhotos();
      onClearAlbum();
      await onUpdateAlbum();
      onLoad();
    },
    { immediate: true },
  );

  watch(
    () => useGroups().config.reverseOrder,
    async () => {
      onClearInit();
      onClearError();
      onClearPhotos();
      onLoad();
    },
  );

  watch(
    photosMaxItems,
    async () => {
      const maxItems = photosMaxItems.value;
      if (isLoadingPhotos.value || maxItems === 0 || isLoadAllPhotos.value) {
        return;
      }

      isLoadingPhotos.value = true;
      screenError.value = undefined;
      const offset = photos.value.length;
      const count = maxItems - offset;
      try {
        const { items }: { items: IPhoto[] } = await useVk().addRequestToQueue({
          method: "photos.get",
          params: {
            album_id: albumId.value,
            owner_id: ownerId.value,
            offset,
            count,
            rev: useGroups().config.reverseOrder ? 1 : 0,
            extended: 1,
          },
        });
        if (items.length === 0) {
          isLoadAllPhotos.value = true;
        }

        photos.value.push(...items);
      } catch (ex: any) {
        alert(ex.message);
        screenError.value = ex;
      }
      isInit.value = true;
      isLoadingPhotos.value = false;
      albumRef.value?.updateVisibleItems(true);
    },
    { immediate: true },
  );

  const onSwitchPhoto = async (mode: "prev" | "next") => {
    if (isLoadingPhotos.value || !isInit.value) {
      return;
    }

    let currentIndex = currentPhotoIndex.value;
    if (currentIndex === undefined) {
      return;
    }

    const indexChangeValue = mode === "prev" ? -1 : 1;

    const onChangeIndex = () =>
      (currentIndex = currentIndex! + indexChangeValue);

    onChangeIndex();
    if (groupsStore.config.skipLowResolutionPhotos) {
      while (
        getPhotoByIndex(currentIndex) !== undefined &&
        PhotoHelper.isPhotoLessSizeAndNotMaxSize(
          getPhotoByIndex(currentIndex)!,
          activeElSize,
        )
      ) {
        onChangeIndex();
        if (getPhotoByIndex(currentIndex) !== undefined) {
          continue;
        }

        showSwitchPhotoSpinner.value = true;
        onMoreLoad();
        await nextTick();

        while (await getFirstRefChange(isLoadingPhotos)) {}

        await nextTick();
        showSwitchPhotoSpinner.value = false;
      }
    }

    return setCurrentPhotoIndex(currentIndex);
  };

  const onMoreLoad = () => {
    // защищаем от переполнения
    if (
      photosMaxItems.value - photos.value.length < 1000 &&
      !isLoadAllPhotos.value
    ) {
      photosMaxItems.value += countOneLoad;
    }
  };
  const onScrollerUpdate = (
    startIndex: number,
    endIndex: number,
    visibleStartIndex: number,
    visibleEndIndex: number,
  ) => {
    if (endIndex + countOneLoad / 3 < photosMaxItems.value) {
      return;
    }

    onMoreLoad();
  };

  watch(
    [photoId, isLoadingPhotos],
    () => {
      if (toStr(photoId.value).length && !isLoadingPhotos.value) {
        if (currentPhotoIndex.value !== undefined) {
          albumRef.value?.scrollToItem(currentPhotoIndex.value);
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
  };
}
