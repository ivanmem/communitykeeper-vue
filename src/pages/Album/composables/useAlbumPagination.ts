import { MaybeRefOrGetter, toValue } from "vue";
import { IPhoto, IPhotoKey } from "@/store/groups/types";
import { useVk } from "@/store/vk/vk";
import { useGroups } from "@/store/groups/groups";
import { PhotoHelper } from "@/shared/helpers/PhotoHelper";
import { GridArray } from "@/shared/composables/useGridArray";
import { useOffsetPagination } from "@/shared/composables/useOffsetPagination";

interface UseAlbumPaginationOptions {
  ownerId: MaybeRefOrGetter<number | string>;
  albumId: MaybeRefOrGetter<number | string>;
  galleryGrid: GridArray<IPhoto>; // Используем GridArray напрямую для манипуляций
  photosMap: Map<IPhotoKey, IPhoto>; // Map для быстрого доступа
  countOneLoad?: number;
}

export function useAlbumPagination(options: UseAlbumPaginationOptions) {
  const { ownerId, albumId, galleryGrid, photosMap, countOneLoad = 150 } =
    options;

  const vkStore = useVk();
  const groupsStore = useGroups();

  const pagination = useOffsetPagination<IPhoto>({
    pageSize: countOneLoad,
    fetchPage: fetchPhotos,
    onPage: addPhotos,
  });

  // Сброс состояния (например, при смене альбома)
  function reset() {
    pagination.reset();
    galleryGrid.clear();
    photosMap.clear();
  }

  async function fetchPhotos(offset: number, count: number) {
    const apiService = await vkStore.getApiService();
    return apiService.photosGet({
      album_id: toValue(albumId),
      owner_id: toValue(ownerId),
      offset,
      count,
      rev: groupsStore.config.reverseOrder ? 1 : 0,
      extended: 1,
      photo_sizes: 1,
    });
  }

  function addPhotos(photos: IPhoto[]) {
    for (const photo of photos) {
      const photoKey = PhotoHelper.getPhotoKey(photo.owner_id, photo.id);

      // При обратном порядке новые фото сдвигают смещение, и API возвращает дубли
      if (photosMap.has(photoKey)) {
        continue;
      }

      photo.__state = {
        index: galleryGrid.items.length,
      };

      photosMap.set(photoKey, photo);
      galleryGrid.push(photo);
    }
  }

  return {
    ...pagination,
    reset,
  };
}
