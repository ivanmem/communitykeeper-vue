import { computed, MaybeRefOrGetter, ref, toValue } from "vue";
import { IAlbumItem } from "@/store/vk/IAlbumItem";
import { useVk } from "@/store/vk/vk";
import { errorToString } from "@/shared/helpers/errorToString";

export function useAlbumInfo(
  ownerIdGetter: MaybeRefOrGetter<number | string>,
  albumIdGetter: MaybeRefOrGetter<number | string>,
) {
  const vkStore = useVk();
  const ownerId = computed(() => toValue(ownerIdGetter));
  const albumId = computed(() => toValue(albumIdGetter));

  const album = ref<IAlbumItem | undefined>();
  const error = ref<string | undefined>();
  const isLoading = ref(false);
  // Ответы запросов, начатых до reset, отбрасываются по номеру поколения
  let generation = 0;

  function reset() {
    generation++;
    album.value = undefined;
    error.value = undefined;
    isLoading.value = false;
  }

  async function load() {
    const currentGeneration = ++generation;
    isLoading.value = true;
    error.value = undefined;

    try {
      const apiService = await vkStore.getApiService();
      // Используем getCachedAlbum как в оригинале, чтобы не делать лишних запросов если инфа есть
      const result = await apiService
        .getCachedAlbum({ owner_id: ownerId.value, album_id: albumId.value })
        .catch((ex) => {
          // Игнорируем ошибку доступа 15, как и было
          if (ex?.errorInfo && ex.errorInfo.error_code !== 15) {
            throw ex;
          }
          return undefined;
        });

      if (currentGeneration === generation) {
        album.value = result;
      }
    } catch (ex: any) {
      if (currentGeneration !== generation) {
        return;
      }

      error.value = errorToString(ex);
      console.warn(
        "Необработанная ошибка получения альбома:",
        ex.errorInfo || ex,
      );
    } finally {
      if (currentGeneration === generation) {
        isLoading.value = false;
      }
    }
  }

  return {
    album,
    error,
    isLoading,
    load,
    reset,
  };
}
