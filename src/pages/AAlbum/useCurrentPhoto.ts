import {
  computed,
  MaybeRefOrGetter,
  nextTick,
  Ref,
  ref,
  toValue,
  watch,
} from "vue";
import { IPhoto } from "vkontakte-api";
import { toStr } from "@/helpers/toStr";
import { PhotoHelper } from "@/helpers/PhotoHelper";
import { useRoute, useRouter } from "vue-router";
import { useGroups } from "@/store/groups/groups";
import { useActiveElement } from "@vueuse/core";
import { useElementDeviceSize } from "@/composables/useElementDeviceSize";
import { SwitchPhotoMode } from "@/pages/AAlbum/types";
import { getFirstRefChange } from "@/helpers/getFirstRefChange";
import { useApp } from "@/store/app/app";

export function useCurrentPhoto(
  photosGetter: MaybeRefOrGetter<IPhoto[] | undefined>,
  photoIdGetter: MaybeRefOrGetter<number | string | undefined>,
  isLoadingPhotos: Ref<boolean>,
  isInit: Ref<boolean>,
  onMoreLoad: () => void,
) {
  const router = useRouter();
  const route = useRoute();
  const groupsStore = useGroups();
  const appStore = useApp();
  const photos = computed(() => toValue(photosGetter));
  const photoId = computed(() => toValue(photoIdGetter));
  // Кэшируем индекс предыдущего найденного фото для оптимизации при перелистывании
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

  const predictPhotoIndex = computed<number | undefined>(() => {
    if (currentPhotoIndex.value === undefined || !photoId.value) {
      return undefined;
    }

    const past = getPhotoByIndex(currentPhotoIndex.value);
    if (past?.id == photoId.value) {
      return currentPhotoIndex.value;
    }

    const next = getPhotoByIndex(+currentPhotoIndex.value + 1);
    if (next?.id == photoId.value) {
      return currentPhotoIndex.value + 1;
    }

    const prev = getPhotoByIndex(currentPhotoIndex.value - 1);
    if (prev?.id == photoId.value) {
      return currentPhotoIndex.value - 1;
    }

    return undefined;
  });

  watch(
    [() => photos.value?.length, photoId, isLoadingPhotos],
    () => {
      if (!photos.value || !toStr(photoId.value).length) {
        currentPhotoIndex.value = undefined;
        return;
      }

      if (predictPhotoIndex.value !== undefined) {
        currentPhotoIndex.value = predictPhotoIndex.value;
        return;
      }

      // если идёт загрузка, то дождёмся её, прежде чем обходить все фото
      if (isLoadingPhotos.value) {
        return;
      }

      for (let i = 0; i < photos.value.length; i++) {
        const photo = photos.value[i];
        if (photo.id != photoId.value) {
          continue;
        }

        currentPhotoIndex.value = i;
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

    let currentIndex = currentPhotoIndex.value;
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
