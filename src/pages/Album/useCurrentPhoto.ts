import { computed, nextTick, Ref, ref, watch } from "vue";
import { PhotoHelper } from "@/shared/helpers/PhotoHelper";
import { useRoute, useRouter } from "vue-router";
import { useGroups } from "@/store/groups/groups";
import { useActiveElement } from "@vueuse/core";
import { useElementDeviceSize } from "@/shared/composables/useElementDeviceSize";
import { getFirstRefChange } from "@/shared/helpers/getFirstRefChange";
import { useApp } from "@/store/app/app";
import { IPhoto, IPhotoKey } from "@/store/groups/types";
import { GridArray } from "@/shared/composables/useGridArray";
import { useImagePreloader } from "@/shared/composables/useImagePreloader";
import { useDialog } from "@/store/dialog/dialog";

export function useCurrentPhoto(
  photos: GridArray<IPhoto>,
  photosMap: Ref<Map<IPhotoKey, IPhoto> | undefined>,
  photoId: Ref<number | string | undefined>,
  ownerId: Ref<string | number>,
  isLoadingPhotos: Ref<boolean>,
  isInit: Ref<boolean>,
  onMoreLoad: () => void,
) {
  const router = useRouter();
  const route = useRoute();
  const groupsStore = useGroups();
  const appStore = useApp();
  const dialogStore = useDialog();
  const currentPhotoIndex = ref<number | undefined>();
  const currentPhoto = computed(() => getPhotoByIndex(currentPhotoIndex.value));
  const imagePreloader = useImagePreloader({ max: 10 });
  const activeEl = useActiveElement();
  const activeElSize = useElementDeviceSize(activeEl, undefined, {
    box: "border-box",
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
    if (groupsStore.config.skipLowResolutionPhotos) {
      prefetchIndex = await getSwitchPhotoBig(prefetchIndex, next);
    }

    const prefetchPhoto = getPhotoByIndex(prefetchIndex);
    if (!prefetchPhoto) return;
    const url = PhotoHelper.getOriginalSize(prefetchPhoto.sizes)?.url;
    imagePreloader.preloadPhoto(url);
  };

  // Получить новый индекс для фото в зависимости от `next`
  const getNewIndex = (currentIndex: number, next: boolean) => {
    return currentIndex + (next ? 1 : -1);
  };

  const getSwitchPhotoBig = async (currentIndex: number, next: boolean) => {
    while (
      getPhotoByIndex(currentIndex) !== undefined &&
      PhotoHelper.isPhotoLessSizeAndNotMaxSize(
        getPhotoByIndex(currentIndex)!,
        activeElSize,
      )
    ) {
      currentIndex = getNewIndex(currentIndex, next);
      if (getPhotoByIndex(currentIndex) !== undefined) {
        continue;
      }

      await appStore.wrapLoading(async () => {
        onMoreLoad();
        await nextTick();

        if (isLoadingPhotos.value) {
          while (await getFirstRefChange(isLoadingPhotos)) {}
        }

        await nextTick();
      })();
    }

    return currentIndex;
  };

  const onSwitchPhoto = async (next: boolean) => {
    if (isLoadingPhotos.value || !isInit.value) {
      return;
    }

    let currentIndex = currentPhoto.value?.__state.index;
    if (currentIndex === undefined) {
      return;
    }

    currentIndex = getNewIndex(currentIndex, next);
    if (groupsStore.config.skipLowResolutionPhotos) {
      currentIndex = await getSwitchPhotoBig(currentIndex, next);
      if (!photos.items[currentIndex]) {
        const disableSkip = await dialogStore.confirm(
          `Отсутствуют фото с высоким разрешением. Отключить пропуск?`,
        );
        if (disableSkip) {
          groupsStore.switchSkipLowResolutionPhotos();
          return onSwitchPhoto(next);
        }
      }
    }

    return await setCurrentPhotoIndex(currentIndex, next);
  };

  watch(
    [() => photos.items?.length, photoId, isLoadingPhotos],
    () => {
      if (photoId.value === undefined) {
        currentPhotoIndex.value = undefined;
        return;
      }

      const photo = photosMap.value?.get(
        PhotoHelper.getPhotoKey(ownerId.value, photoId.value),
      );
      if (photo !== undefined) {
        currentPhotoIndex.value = photo.__state.index;
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
    getSwitchPhotoBig,
    setCurrentPhotoIndex,
    setCurrentPhotoId,
    onSwitchPhoto,
    imagePreloader,
  };
}
