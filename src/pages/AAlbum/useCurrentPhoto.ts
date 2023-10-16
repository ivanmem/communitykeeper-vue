import { computed, nextTick, Ref, ref, watch } from "vue";
import { PhotoHelper } from "@/helpers/PhotoHelper";
import { useRoute, useRouter } from "vue-router";
import { useGroups } from "@/store/groups/groups";
import { useActiveElement } from "@vueuse/core";
import { useElementDeviceSize } from "@/composables/useElementDeviceSize";
import { SwitchPhotoMode } from "@/pages/AAlbum/types";
import { getFirstRefChange } from "@/helpers/getFirstRefChange";
import { useApp } from "@/store/app/app";
import { IPhoto, IPhotoKey } from "@/store/groups/types";

export function useCurrentPhoto(
  photos: Ref<IPhoto[] | undefined>,
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
  const currentPhotoIndex = ref<number | undefined>();
  const currentPhoto = computed(() => getPhotoByIndex(currentPhotoIndex.value));

  const getPhotoByIndex = (index?: number) => {
    if (index === undefined) {
      return undefined;
    }

    return photos.value?.[index];
  };

  const prefetchPhoto = (photo: IPhoto | undefined) => {
    if (!photo) {
      return;
    }

    const img = new Image();
    img.src = PhotoHelper.getOriginalSize(photo.sizes)?.url ?? "";
  };

  const setCurrentPhotoId = async (photoId: number | string | undefined) => {
    await router.replace({
      params: { ...route.params, photoId: photoId ?? "" },
    });
  };

  const setCurrentPhotoIndex = async (
    index: number | undefined,
    mode?: SwitchPhotoMode,
  ) => {
    if (photos.value === undefined) {
      return;
    }

    if (index === undefined) {
      return setCurrentPhotoId(undefined);
    }

    // кэшируем текущее фото и следующее
    prefetchPhoto(getPhotoByIndex(index));
    if (!mode || mode === "next") {
      let prefetchIndex = index + 1;
      if (groupsStore.config.skipLowResolutionPhotos) {
        prefetchIndex = await getSwitchPhotoBig(prefetchIndex, "next");
      }

      prefetchPhoto(getPhotoByIndex(prefetchIndex));
    }

    const photo = getPhotoByIndex(index);
    return setCurrentPhotoId(photo?.id);
  };

  watch(
    [() => photos.value?.length, photoId, isLoadingPhotos],
    () => {
      if (!photos.value || photoId.value === undefined) {
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

  const activeEl = useActiveElement();
  const activeElSize = useElementDeviceSize(activeEl, undefined, {
    box: "border-box",
  });
  // Получить новый индекс для фото в зависимости от mode
  const getSwitchPhotoIndexByMode = (
    currentIndex: number,
    mode: SwitchPhotoMode,
  ) => {
    return currentIndex + (mode === "prev" ? -1 : 1);
  };

  const getSwitchPhotoBig = async (
    currentIndex: number,
    mode: SwitchPhotoMode,
  ) => {
    while (
      getPhotoByIndex(currentIndex) !== undefined &&
      PhotoHelper.isPhotoLessSizeAndNotMaxSize(
        getPhotoByIndex(currentIndex)!,
        activeElSize,
      )
    ) {
      currentIndex = getSwitchPhotoIndexByMode(currentIndex, mode);
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

  const onSwitchPhoto = async (mode: SwitchPhotoMode) => {
    if (isLoadingPhotos.value || !isInit.value) {
      return;
    }

    let currentIndex = currentPhoto.value?.__state.index;
    if (currentIndex === undefined) {
      return;
    }

    currentIndex = getSwitchPhotoIndexByMode(currentIndex, mode);
    if (groupsStore.config.skipLowResolutionPhotos) {
      currentIndex = await getSwitchPhotoBig(currentIndex, mode);
    }

    return await setCurrentPhotoIndex(currentIndex, mode);
  };

  return {
    currentPhoto,
    currentPhotoIndex,
    getPhotoByIndex,
    getSwitchPhotoBig,
    setCurrentPhotoIndex,
    setCurrentPhotoId,
    onSwitchPhoto,
  };
}
