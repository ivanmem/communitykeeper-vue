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

  function reset() {
    album.value = undefined;
    error.value = undefined;
    isLoading.value = false;
  }

  async function load() {
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

      album.value = result;
    } catch (ex: any) {
      error.value = errorToString(ex);
      console.warn(
        "Необработанная ошибка получения альбома:",
        ex.errorInfo || ex,
      );
    } finally {
      isLoading.value = false;
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
