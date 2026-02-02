import { computed, MaybeRefOrGetter, ref, toValue } from "vue";
import { IPhoto, IPhotoKey } from "@/store/groups/types";
import { useVk } from "@/store/vk/vk";
import { useGroups } from "@/store/groups/groups";
import { PhotoHelper } from "@/shared/helpers/PhotoHelper";
import { errorToString } from "@/shared/helpers/errorToString";
import { GridArray } from "@/shared/composables/useGridArray";

interface UseAlbumPaginationOptions {
  ownerId: MaybeRefOrGetter<number | string>;
  albumId: MaybeRefOrGetter<number | string>;
  galleryGrid: GridArray<IPhoto>; // Используем GridArray напрямую для манипуляций
  photosMap: Map<IPhotoKey, IPhoto>; // Map для быстрого доступа
  countOneLoad?: number;
}

export function useAlbumPagination(options: UseAlbumPaginationOptions) {
  const {
    ownerId: ownerIdGetter,
    albumId: albumIdGetter,
    galleryGrid,
    photosMap,
    countOneLoad = 150,
  } = options;

  const vkStore = useVk();
  const groupsStore = useGroups();

  const isLoading = ref(false);
  const isAllLoaded = ref(false);
  const isInit = ref(false);
  const error = ref<string | undefined>();
  const totalCount = ref<number | undefined>();

  // Вычисляемые свойства для доступа к текущим значениям
  const ownerId = computed(() => toValue(ownerIdGetter));
  const albumId = computed(() => toValue(albumIdGetter));

  // Сброс состояния (например, при смене альбома)
  function reset() {
    isLoading.value = false;
    isAllLoaded.value = false;
    isInit.value = false;
    error.value = undefined;
    totalCount.value = undefined;
    galleryGrid.clear();
    photosMap.clear();
  }

  // Загрузка следующей порции фото
  async function loadNext() {
    // Предотвращение параллельных запросов и лишних вызовов
    if (isLoading.value || isAllLoaded.value) {
      return;
    }

    isLoading.value = true;
    error.value = undefined;

    try {
      const apiService = await vkStore.getApiService();
      const offset = galleryGrid.items.length;

      const count = countOneLoad;

      // Получаем items и count из ответа
      const response = await apiService.photosGet({
        album_id: albumId.value,
        owner_id: ownerId.value,
        offset,
        count,
        rev: groupsStore.config.reverseOrder ? 1 : 0,
        extended: 1,
        photo_sizes: 1,
      });

      const items = response.items;

      // Обновляем общее количество, если оно пришло
      if (typeof response.count === "number") {
        totalCount.value = response.count;
      }

      if (items.length === 0) {
        isAllLoaded.value = true;
      } else {
        // Если вернулось меньше чем просили - значит это конец
        if (items.length < count) {
          isAllLoaded.value = true;
        }

        for (const newPhoto of items) {
          const photoKey = PhotoHelper.getPhotoKey(
            newPhoto.owner_id,
            newPhoto.id,
          );

          // Пропускаем дубликаты, если они вдруг есть (хотя не должны)
          if (photosMap.has(photoKey)) {
            continue;
          }

          newPhoto.__state = {
            index: galleryGrid.items.length,
          };

          photosMap.set(photoKey, newPhoto);
          galleryGrid.push(newPhoto);
        }
      }

      isInit.value = true;
    } catch (ex: any) {
      error.value = errorToString(ex);
      console.warn("Ошибка загрузки фото:", ex);
    } finally {
      isLoading.value = false;
    }
  }

  return {
    isLoading,
    isAllLoaded,
    isInit,
    error,
    totalCount,
    loadNext,
    reset,
  };
}
