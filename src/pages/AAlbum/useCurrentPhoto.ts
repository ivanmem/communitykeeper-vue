import { computed, MaybeRefOrGetter, ref, toValue, watch } from "vue";
import { IPhoto } from "vkontakte-api";
import { toStr } from "@/helpers/toStr";

export function useCurrentPhoto(
  photosGetter: MaybeRefOrGetter<IPhoto[] | undefined>,
  photoIdGetter: MaybeRefOrGetter<number | string | undefined>
) {
  const photos = computed(() => toValue(photosGetter));
  const photoId = computed(() => toValue(photoIdGetter));

  const getPhotoByIndex = (index?: number) => {
    if (index === undefined) {
      return undefined;
    }

    return photos.value?.[index];
  };

  // Кэшируем индекс предыдущего найденного фото для оптимизации при перелистывании
  const currentPhotoIndex = ref<number | undefined>();
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

  const setCurrentPhotoIndex = (index: number | undefined) => {
    currentPhotoIndex.value = index;
  };

  watch(
    [photoId, photos],
    () => {
      if (!photos.value || !toStr(photoId.value).length) {
        setCurrentPhotoIndex(undefined);
        return;
      }

      if (predictPhotoIndex.value !== undefined) {
        setCurrentPhotoIndex(predictPhotoIndex.value);
        return;
      }

      for (let i = 0; i < photos.value.length; i++) {
        const photo = photos.value[i];
        if (photo.id != photoId.value) {
          continue;
        }

        setCurrentPhotoIndex(i);
        return;
      }

      setCurrentPhotoIndex(undefined);
    },
    { immediate: true }
  );

  return {
    currentPhoto: computed(() => getPhotoByIndex(currentPhotoIndex.value)),
    currentPhotoIndex,
  };
}
