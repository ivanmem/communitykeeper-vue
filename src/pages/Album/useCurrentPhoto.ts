import { computed, nextTick, Ref, ref, watch, watchEffect } from "vue";
import { PhotoHelper } from "@/shared/helpers/PhotoHelper";
import { useRoute, useRouter } from "vue-router";
import { useGroups } from "@/store/groups/groups";
import { useElementDeviceSize } from "@/shared/composables/useElementDeviceSize";
import { getFirstRefChange } from "@/shared/helpers/getFirstRefChange";
import { useApp } from "@/store/app/app";
import { IPhoto, IPhotoKey } from "@/store/groups/types";
import { GridArray } from "@/shared/composables/useGridArray";
import { useImagePreloader } from "@/shared/composables/useImagePreloader";
import { useDialog } from "@/store/dialog/dialog";
import type AlbumPhoto from "@/pages/Album/AlbumPhoto.vue";

export const currentAverageLikes = ref(0);
export const currentAlbumPhotoElSize = {
  height: computed(() => 0),
  width: computed(() => 0),
};

export function useCurrentPhoto(
  albumPhotoRef: Ref<InstanceType<typeof AlbumPhoto> | undefined>,
  photos: GridArray<IPhoto>,
  photosMap: Ref<Map<IPhotoKey, IPhoto> | undefined>,
  photoId: Ref<number | string | undefined>,
  ownerId: Ref<string | number>,
  isLoadingPhotos: Ref<boolean>,
  isInit: Ref<boolean>,
  onMoreLoad: () => void,
  directPhoto?: Ref<IPhoto | undefined>,
) {
  const router = useRouter();
  const route = useRoute();
  const groupsStore = useGroups();
  const appStore = useApp();
  const dialogStore = useDialog();
  const currentPhotoIndex = ref<number | undefined>();
  const currentPhoto = computed(() => getPhotoByIndex(currentPhotoIndex.value));
  const imagePreloader = useImagePreloader({ max: 10 });
  const albumPhotoElSize = useElementDeviceSize(
    () => albumPhotoRef.value?.photoDiv,
    undefined,
    {
      box: "border-box",
    },
  );

  currentAlbumPhotoElSize.height = albumPhotoElSize.height;
  currentAlbumPhotoElSize.width = albumPhotoElSize.width;

  watchEffect(() => {
    let likes = 0;
    for (const item of photos.items) {
      if (item.likes === undefined) {
        continue;
      }

      likes += item.likes.count;
    }

    currentAverageLikes.value = Math.round(likes / photos.items.length);
  });

  const initPreloadPhoto = () => {
    if (
      imagePreloader.photos.value.size > 0 ||
      currentPhotoIndex.value === undefined
    ) {
      return;
    }

    setPreloadPhotoIndex(currentPhotoIndex.value, true).then();
  };

  const getPhotoByIndex = (index?: number) => {
    if (index === undefined) {
      return undefined;
    }

    // Если индекс -1, это прямо загруженное фото
    if (index === -1 && directPhoto?.value) {
      return directPhoto.value;
    }

    return photos.items[index];
  };

  const setCurrentPhotoId = async (newPhotoId: number | string | undefined) => {
    await router.replace({
      params: { ...route.params, photoId: newPhotoId ?? "" },
    });
  };

  const setCurrentPhotoIndex = async (
    index: number | undefined,
    next?: boolean,
  ) => {
    if (index === undefined) {
      return setCurrentPhotoId(undefined);
    }

    const photo = getPhotoByIndex(index);
    if (!photo) return;
    await setCurrentPhotoId(photo?.id);
    await setPreloadPhotoIndex(index, next ?? true);
  };

  const setPreloadPhotoIndex = async (index: number, next: boolean) => {
    let prefetchIndex = getNewIndex(index, next);
    prefetchIndex = await skipPhotoIndex(prefetchIndex, next, false);
    const prefetchPhoto = getPhotoByIndex(prefetchIndex);
    if (!prefetchPhoto) return;
    const url = PhotoHelper.getOriginalSize(prefetchPhoto.sizes)?.url;
    imagePreloader.preloadPhoto(url);
  };

  const skipPhotoIndex = async (
    index: number,
    next: boolean,
    alert: boolean,
  ) => {
    let prevPrefetchIndex: number | undefined = undefined;

    // выполняем функции до тех пор, пока индекс не совпадёт
    while (prevPrefetchIndex !== index) {
      prevPrefetchIndex = index;
      if (groupsStore.config.skipLowResolutionPhotos) {
        index = await skipLowResolution(index, next, alert);
      }

      if (groupsStore.config.skipLowLikesPhotos) {
        index = await skipLowLikes(index, next, alert);
      }
    }

    return index;
  };

  // Получить новый индекс для фото в зависимости от `next`
  const getNewIndex = (currentIndex: number, next: boolean) => {
    return currentIndex + (next ? 1 : -1);
  };

  const loadNextPhotos = async () => {
    await appStore.wrapLoading(async () => {
      onMoreLoad();
      await nextTick();

      if (isLoadingPhotos.value) {
        while (await getFirstRefChange(isLoadingPhotos)) {}
      }

      await nextTick();
    })();
  };

  const skipLowResolution = async (
    currentIndex: number,
    next: boolean,
    alert: boolean,
  ) => {
    if (!photos.items[currentIndex]) {
      return currentIndex;
    }

    let newIndex = currentIndex;
    while (
      getPhotoByIndex(newIndex) !== undefined &&
      PhotoHelper.isPhotoLessSizeAndNotMaxSize(
        getPhotoByIndex(newIndex)!,
        albumPhotoElSize,
      )
    ) {
      newIndex = getNewIndex(newIndex, next);
      if (getPhotoByIndex(newIndex) !== undefined || !next) {
        continue;
      }

      await loadNextPhotos();
    }

    if (alert && !photos.items[newIndex]) {
      const disableSkip = await dialogStore.confirm(
        `Отсутствуют фото с высоким разрешением. Отключить пропуск?`,
      );
      if (disableSkip) {
        groupsStore.switchSkipLowResolutionPhotos();
        return currentIndex;
      }
    }

    return newIndex;
  };

  const skipLowLikes = async (
    currentIndex: number,
    next: boolean,
    alert: boolean,
  ) => {
    if (!photos.items[currentIndex]) {
      return currentIndex;
    }

    let newIndex = currentIndex;
    while (true) {
      const photo = getPhotoByIndex(newIndex);
      if (photo === undefined) {
        break;
      }

      if (
        photo.likes === undefined ||
        currentAverageLikes.value === 0 ||
        photo.likes.count > currentAverageLikes.value
      ) {
        break;
      }

      newIndex = getNewIndex(newIndex, next);
      if (getPhotoByIndex(newIndex) !== undefined || !next) {
        continue;
      }

      await loadNextPhotos();
    }

    if (alert && !photos.items[newIndex]) {
      const disableSkip = await dialogStore.confirm(
        `Все оставшиеся фото с меньшим количеством лайков, чем в среднем в этом альбоме (${currentAverageLikes.value}). Отключить пропуск?`,
      );
      if (disableSkip) {
        groupsStore.switchSkipLowLikesPhotos();
        return currentIndex;
      }
    }

    return newIndex;
  };

  const onSwitchPhoto = async (next: boolean, showInfoCallback?: () => void) => {
    if (isLoadingPhotos.value || !isInit.value) {
      return;
    }

    let currentIndex = currentPhoto.value?.__state.index;
    if (currentIndex === undefined) {
      return;
    }

    // Если текущее фото загружено напрямую (индекс -1), 
    // не даём листать пока не найдём его в списке
    if (currentIndex === -1) {
      // Показываем счётчик при попытке навигации во время загрузки
      showInfoCallback?.();
      return;
    }

    const newIndex = getNewIndex(currentIndex, next);
    
    // Не позволяем переходить на индекс -1 или меньше
    if (newIndex < 0) {
      // Показываем счётчик при попытке выйти за границы
      showInfoCallback?.();
      return;
    }
    
    const skippedIndex = await skipPhotoIndex(newIndex, next, true);
    return await setCurrentPhotoIndex(skippedIndex, next);
  };

  watch(
    [() => photos.items?.length, photoId, isLoadingPhotos, () => directPhoto?.value],
    () => {
      if (photoId.value === undefined) {
        currentPhotoIndex.value = undefined;
        return;
      }

      // Сначала проверяем в основном списке
      const photo = photosMap.value?.get(
        PhotoHelper.getPhotoKey(ownerId.value, photoId.value),
      );
      if (photo !== undefined) {
        currentPhotoIndex.value = photo.__state.index;
        return;
      }

      // Если не найдено в списке, проверяем directPhoto
      if (directPhoto?.value && 
          PhotoHelper.getPhotoKey(directPhoto.value.owner_id, directPhoto.value.id) === 
          PhotoHelper.getPhotoKey(ownerId.value, photoId.value)) {
        currentPhotoIndex.value = -1;
        return;
      }

      // если идёт загрузка, то дождёмся её, прежде чем закрывать фото
      if (isLoadingPhotos.value) {
        return;
      }

      currentPhotoIndex.value = undefined;
    },
    { immediate: true },
  );

  watch(currentPhotoIndex, initPreloadPhoto);

  return {
    currentPhoto,
    currentPhotoIndex,
    getPhotoByIndex,
    setCurrentPhotoIndex,
    setCurrentPhotoId,
    onSwitchPhoto,
    imagePreloader,
  };
}
