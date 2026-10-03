import { ref, Ref, watch } from "vue";
import { useVk } from "@/store/vk/vk";
import { PhotoHelper } from "@/shared/helpers/PhotoHelper";
import { IPhoto, IPhotoKey } from "@/store/groups/types";

/** @description Фото из URL, которое ещё не попало в загруженный список альбома */
export function useDirectPhoto(
  ownerId: Readonly<Ref<number | string>>,
  photoId: Readonly<Ref<number | string | undefined>>,
  photosMap: Ref<Map<IPhotoKey, IPhoto>>,
) {
  const vkStore = useVk();
  const photo = ref<IPhoto>();
  const isLoading = ref(false);
  // Ответы запросов, начатых до reset или новой загрузки, отбрасываются
  let generation = 0;

  // Сбрасываем, когда открыто другое фото или прямое фото догрузилось в список
  watch([photoId, () => photosMap.value.size], clearIfOutdated);

  function reset() {
    generation++;
    photo.value = undefined;
    isLoading.value = false;
  }

  async function load() {
    const photoKey = PhotoHelper.getPhotoKeyOrUndefined(
      ownerId.value,
      photoId.value,
    );
    // Если фото уже есть в списке - не грузим ничего
    if (!photoKey || photosMap.value.has(photoKey)) {
      return;
    }

    const currentGeneration = ++generation;
    isLoading.value = true;

    try {
      const apiService = await vkStore.getApiService();
      const [loadedPhoto] = await apiService.photosGetById({
        photos: `${ownerId.value}_${photoId.value}`,
      });
      if (currentGeneration !== generation || !loadedPhoto) {
        return;
      }

      // Спец индекс: фото вне списка
      loadedPhoto.__state = { index: -1 };
      photo.value = loadedPhoto;
    } catch (ex) {
      console.warn("Ошибка загрузки прямого фото:", ex);
    } finally {
      if (currentGeneration === generation) {
        isLoading.value = false;
      }
    }
  }

  function clearIfOutdated() {
    if (!photo.value) {
      return;
    }

    const photoKey = PhotoHelper.getPhotoKey(photo.value.owner_id, photo.value.id);
    if (
      photosMap.value.has(photoKey) ||
      photoKey !==
        PhotoHelper.getPhotoKeyOrUndefined(ownerId.value, photoId.value)
    ) {
      photo.value = undefined;
    }
  }

  return {
    photo,
    isLoading,
    load,
    reset,
  };
}
