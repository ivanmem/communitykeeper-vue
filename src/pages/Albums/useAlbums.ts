import { computed, MaybeRefOrGetter, ref, toValue, watch } from "vue";
import { IAlbumItem } from "@/store/vk/IAlbumItem";
import { IGroup } from "@/store/groups/types";
import { useGroups } from "@/store/groups/groups";
import {
  AlbumsPreviewSizesInitial,
  getStaticAlbums,
  wallAlbumStatic,
} from "@/pages/Albums/consts";
import { useVk } from "@/store/vk/vk";
import { useScreenSpinner } from "@/shared/composables/useScreenSpinner";
import { useScrollRestore } from "@/shared/composables/useScrollRestore";
import { errorToString } from "@/shared/helpers/errorToString";
import { useGalleryPreviewPreloader } from "@/shared/composables/useGalleryPreviewPreloader";
import { VK_ERROR_CODE } from "@/shared/constants/consts";
import { isVKError } from "vkontakte-api";
import { useGalleryComponent } from "@/shared/composables/useGalleryComponent";
import { useApp } from "@/store/app/app";
import { useOffsetPagination } from "@/shared/composables/useOffsetPagination";
import { useGalleryInfiniteScroll } from "@/shared/composables/useGalleryInfiniteScroll";

const countOneLoad = 100;

export function useAlbums(ownerIdGetter: MaybeRefOrGetter<number | string>) {
  const groupsStore = useGroups();
  const vkStore = useVk();
  const appStore = useApp();
  const ownerId = computed(() => toValue(ownerIdGetter));

  const group = ref<IGroup | undefined>();
  const staticAlbums = computed(() => getStaticAlbums(ownerId.value));
  const gallery = useGalleryComponent<IAlbumItem>(AlbumsPreviewSizesInitial);
  const screenError = ref<any>();
  const pagination = useOffsetPagination<IAlbumItem>({
    pageSize: countOneLoad,
    fetchPage: fetchAlbums,
    onPage: pushAlbums,
  });
  // Результаты подготовки предыдущего владельца отбрасываются по этому номеру
  let ownerChangeId = 0;

  useScreenSpinner(() => !pagination.isInit.value);

  const previewPreloader = useGalleryPreviewPreloader(gallery);

  const { setLastScrollTop } = useScrollRestore(
    () => gallery.componentRef.value?.$el,
  );

  watch(ownerId, onOwnerIdChange, { immediate: true });

  watch(pagination.error, onPaginationError);

  useGalleryInfiniteScroll(gallery.el, pagination);

  const loadAllAlbums = appStore.wrapLoading(async () => {
    // Останавливаемся на ошибке, чтобы не повторять запрос бесконечно
    do {
      await pagination.loadNext();
    } while (!pagination.isAllLoaded.value && !pagination.error.value);
  });

  function pushAlbums(albums: IAlbumItem[]): void {
    gallery.grid.push(...albums);
  }

  async function fetchAlbums(offset: number, count: number) {
    const apiService = await vkStore.getApiService();
    try {
      return await apiService.getAlbums({
        owner_id: ownerId.value,
        offset,
        count,
      });
    } catch (ex) {
      // Нет доступа к альбомам: показываем то, что уже есть, без ошибки
      if (
        isVKError(ex) &&
        ex.errorInfo.error_code === VK_ERROR_CODE.accessDenied
      ) {
        return { items: [], count: 0 };
      }

      throw ex;
    }
  }

  async function onOwnerIdChange(): Promise<void> {
    const changeId = ++ownerChangeId;
    pagination.reset();
    gallery.clear();
    group.value = undefined;
    screenError.value = undefined;
    setLastScrollTop(undefined);

    if (+ownerId.value < 0) {
      await addGroupStaticAlbums(changeId);
      if (changeId !== ownerChangeId) {
        return;
      }
    }

    await pagination.loadNext();
  }

  async function addGroupStaticAlbums(changeId: number): Promise<void> {
    const loadedGroup = await groupsStore
      .getGroupByIdOrLoad(-ownerId.value)
      .catch(() => undefined);
    if (changeId !== ownerChangeId) {
      return;
    }

    group.value = loadedGroup;

    try {
      const apiService = await vkStore.getApiService();
      const wallAlbum = await apiService.createAlbumItem({
        title: wallAlbumStatic.title,
        album_id: wallAlbumStatic.id,
        owner_id: +ownerId.value,
      });
      if (changeId === ownerChangeId) {
        gallery.grid.push(wallAlbum);
      }
    } catch (ex) {
      if (changeId !== ownerChangeId) {
        return;
      }

      if (
        isVKError(ex) &&
        ex.errorInfo.error_code === VK_ERROR_CODE.accessDenied &&
        ex.message.endsWith("id blocked")
      ) {
        screenError.value = errorToString(ex);
      } else {
        gallery.grid.push(...staticAlbums.value);
      }
    }
  }

  function onPaginationError(error: string | undefined): void {
    if (error) {
      screenError.value = error;
    }
  }

  return {
    componentRef: gallery.componentRef,
    sizes: gallery.sizes,
    columns: gallery.columns,
    isInit: pagination.isInit,
    group,
    albums: gallery.grid,
    previewPreloader,
    screenError,
    isAllLoaded: pagination.isAllLoaded,
    loadAllAlbums,
  };
}
