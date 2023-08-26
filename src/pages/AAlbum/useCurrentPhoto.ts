import { computed, MaybeRefOrGetter, ref, toValue, watch } from "vue";
import { IPhoto } from "vkontakte-api";
import { toStr } from "@/helpers/toStr";
import { PhotoHelper } from "@/helpers/PhotoHelper";
import { useRoute, useRouter } from "vue-router";

export function useCurrentPhoto(
  photosGetter: MaybeRefOrGetter<IPhoto[] | undefined>,
  photoIdGetter: MaybeRefOrGetter<number | string | undefined>,
  isLoadingPhotosGetter: MaybeRefOrGetter<boolean>,
) {
  const router = useRouter();
  const route = useRoute();
  const photos = computed(() => toValue(photosGetter));
  const photoId = computed(() => toValue(photoIdGetter));
  const isLoadingPhotos = computed(() => toValue(isLoadingPhotosGetter));
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

  const setCurrentPhotoIndex = (index: number | undefined) => {
    if (photos.value === undefined) {
      return;
    }

    if (index !== undefined) {
      // кэшируем текущее фото и два следующих
      prefetchPhoto(photos.value[index]);
      prefetchPhoto(photos.value[index + 1]);
      prefetchPhoto(photos.value[index + 2]);
    }

    if (index === undefined) {
      return setCurrentPhotoId(undefined);
    }

    const photo = photos.value[index];
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
    [() => photos.value?.length, photoId],
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

  return {
    currentPhoto,
    currentPhotoIndex,
    getPhotoByIndex,
    setCurrentPhotoIndex,
    setCurrentPhotoId,
  };
}
