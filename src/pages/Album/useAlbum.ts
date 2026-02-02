import { IAlbumItem } from "@/store/vk/IAlbumItem";
import { useVk } from "@/store/vk/vk";
import { AlbumsPreviewSizesInitial } from "@/pages/Albums/consts";
import { computed, MaybeRefOrGetter, ref, toValue, watch } from "vue";
import { useCurrentPhoto } from "@/pages/Album/useCurrentPhoto";
import { useScreenSpinner } from "@/shared/composables/useScreenSpinner";
import { toStr } from "@/shared/helpers/toStr";
import { useGroups } from "@/store/groups/groups";
import { useHistory } from "@/store/history/history";
import { toNumberOrUndefined } from "@/shared/helpers/toNumberOrUndefined";
import { IPhoto, IPhotoKey } from "@/store/groups/types";
import { PhotoHelper } from "@/shared/helpers/PhotoHelper";
import { useImagePreloader } from "@/shared/composables/useImagePreloader";
import { useScrollRestore } from "@/shared/composables/useScrollRestore";
import { useGalleryComponent } from "@/shared/composables/useGalleryComponent";
import { useAlbumPagination } from "@/pages/Album/composables/useAlbumPagination";
import { useAlbumInfo } from "@/pages/Album/composables/useAlbumInfo";

const countOneLoad = 150;

export function useAlbum(
  ownerIdGetter: MaybeRefOrGetter<number | string>,
  albumIdGetter: MaybeRefOrGetter<number | string>,
  photoIdGetter: MaybeRefOrGetter<number | string | undefined>,
) {
  const photosMap = ref<Map<IPhotoKey, IPhoto>>(new Map());
  const screenError = ref<any>();

  // Прямое фото (загруженное по ID из URL, если его нет в списке)
  const directPhoto = ref<IPhoto | undefined>();
  const isLoadingDirectPhoto = ref(false);

  const historyStore = useHistory();
  const groupsStore = useGroups();
  const vkStore = useVk();

  const ownerId = computed(() => toValue(ownerIdGetter));
  const albumIdRaw = computed(() => toValue(albumIdGetter));
  // Обработка "wall" -> -7
  const albumId = computed(() => {
    const value = albumIdRaw.value;
    return value == "wall" ? -7 : value;
  });
  const photoId = computed(() => toValue(photoIdGetter));

  const gallery = useGalleryComponent<IPhoto>(AlbumsPreviewSizesInitial);

  const pagination = useAlbumPagination({
    ownerId,
    albumId,
    galleryGrid: gallery.grid,
    photosMap: photosMap.value,
    countOneLoad,
  });

  const albumInfo = useAlbumInfo(ownerId, albumId);

  const photo = computed(() =>
    photosMap.value?.get(
      PhotoHelper.getPhotoKeyOrUndefined(ownerId.value, photoId.value) ??
        ("" as IPhotoKey),
    ),
  );

  const albumSize = computed(
    () =>
      pagination.totalCount.value ??
      toNumberOrUndefined(albumInfo.album.value?.size) ??
      (pagination.isAllLoaded.value
        ? gallery.grid.items.length
        : `${gallery.grid.items.length}+`),
  );

  const albumHistoryItem = computed(() =>
    historyStore.getViewAlbum(ownerId.value, albumId.value),
  );

  const albumIsEmpty = computed(() =>
    typeof albumSize.value === "string"
      ? gallery.grid.items.length === 0
      : albumSize.value === 0,
  );

  useScreenSpinner(() => !pagination.isInit.value);

  // Загрузка "прямого" фото
  const loadDirectPhoto = async () => {
    if (!photoId.value || isLoadingDirectPhoto.value) {
      return;
    }

    // Если фото уже есть и мы просто перешли на него - не грузим ничего
    if (photo.value) return;

    isLoadingDirectPhoto.value = true;
    try {
      const apiService = await vkStore.getApiService();
      const photos = await apiService.photosGetById({
        photos: `${ownerId.value}_${photoId.value}`,
        extended: 1,
        photo_sizes: 1,
      });

      if (photos.length > 0) {
        const loadedPhoto = photos[0];
        loadedPhoto.__state = {
          index: -1, // спец индекс
        };
        directPhoto.value = loadedPhoto;
      }
    } catch (ex: any) {
      console.warn("Ошибка загрузки прямого фото:", ex);
    } finally {
      isLoadingDirectPhoto.value = false;
    }
  };

  const {
    currentPhoto,
    currentPhotoIndex,
    setCurrentPhotoIndex,
    setCurrentPhotoId,
    onSwitchPhoto,
    imagePreloader,
  } = useCurrentPhoto(
    gallery.albumPhotoRef,
    gallery.grid,
    photosMap,
    photoId,
    ownerId,
    pagination.isLoading,
    pagination.isInit,
    pagination.loadNext,
    directPhoto,
  );

  const previewPreloader = useImagePreloader({
    max: () => gallery.columns.value * 4,
    freeze: () => Boolean(currentPhoto.value),
  });

  const { setLastScrollTop } = useScrollRestore(
    () => gallery.componentRef.value?.$el,
  );

  const preloadNextPreviews = () => {
    const previewPhotos = gallery.grid.items
      .slice(
        gallery.endIndex.value + gallery.columns.value,
        gallery.endIndex.value + gallery.columns.value * 2,
      )
      .map(
        (photo) =>
          PhotoHelper.getPreviewSize(photo.sizes, gallery.sizes.value)?.url,
      );
    previewPreloader.preloadPhoto(previewPhotos);
  };

  const onScrollerUpdate = () => {
    if (!gallery.componentRef.value) {
      return;
    }
    // Если мы проскроллили близко к концу (почти нет места), грузим еще
    // 1/3 страницы запаса
    if (gallery.endIndex.value + countOneLoad / 3 < gallery.grid.items.length) {
      return;
    }

    // В старом коде было photosMaxItems, здесь мы смотрим на реальную длину грида
    // Если длина грида меньше чем мы думаем что загрузили (тут логика старая была завязана на photosMaxItems)
    // В новой логике: если мы близко к концу списка, зовем loadNext
    pagination.loadNext();
  };

  // Обновление заголовка истории
  watch([albumHistoryItem, albumInfo.album, currentPhotoIndex], () => {
    if (
      !albumHistoryItem.value ||
      !albumInfo.album.value ||
      currentPhotoIndex.value === undefined
    ) {
      return;
    }

    albumHistoryItem.value.subtitle = `${albumInfo.album.value.title} (${
      currentPhotoIndex.value + 1
    } из ${albumSize.value})`;
  });

  // Инициализация и смена альбома
  watch(
    [ownerId, albumId],
    async () => {
      // Сброс
      screenError.value = undefined;
      pagination.reset();
      albumInfo.reset();
      setLastScrollTop(undefined);
      directPhoto.value = undefined;

      // Загрузка
      // Запускаем параллельно информацию об альбоме и фото
      const albumPromise = albumInfo.load();

      // Если есть photoId, пробуем загрузить его (если оно не в начале списка)
      if (photoId.value) {
        await loadDirectPhoto();
      }

      const photosPromise = pagination.loadNext();

      await Promise.all([albumPromise, photosPromise]);

      // Ошибки пагинации прокидываем в экран (если критично)
      if (pagination.error.value) {
        screenError.value = pagination.error.value;
      }
      if (albumInfo.error.value && !screenError.value) {
        screenError.value = albumInfo.error.value;
      }
    },
    { immediate: true },
  );

  // Смена порядка сортировки
  watch(
    () => groupsStore.config.reverseOrder,
    async () => {
      screenError.value = undefined;
      pagination.reset();
      await pagination.loadNext();
    },
  );

  // Навигация к фото
  watch(
    [photoId, pagination.isLoading],
    () => {
      if (toStr(photoId.value).length && !pagination.isLoading.value) {
        if (photo.value !== undefined && photo.value.__state.index >= 0) {
          gallery.componentRef.value?.scrollToIndex(
            Math.floor(photo.value.__state.index / gallery.columns.value),
          );
        } else if (!screenError.value && !directPhoto.value) {
          // Если фото нет, но оно задано, и мы не грузимся - пробуем подгрузить еще
          // Вдруг оно дальше в списке
          pagination.loadNext();
        }
      }

      // Очистка directPhoto если нашли фото в основном списке или сменили ID
      if (directPhoto.value && photoId.value) {
        const currentKey = PhotoHelper.getPhotoKey(
          ownerId.value,
          photoId.value,
        );
        const directKey = PhotoHelper.getPhotoKey(
          directPhoto.value.owner_id,
          directPhoto.value.id,
        );

        // Если мы переключились на другое фото
        if (currentKey !== directKey) {
          directPhoto.value = undefined;
        }
        // Если фото нашлось в списке (например догрузилось), directPhoto уже не нужен?
        // В оригинале: "Если это прямо загруженное фото, очищаем directPhoto" внутри onLoad при переборе items.
        // Здесь это делает pagination.loadNext внутри себя? Нет, pagination не знает про directPhoto.
        // Добавим watcher или логику в pagination?
        // Лучше здесь. Если фото есть в photosMap, directPhoto убиваем.
        if (photosMap.value.has(directKey)) {
          directPhoto.value = undefined;
        }
      }
    },
    { immediate: true, deep: true },
  );

  // Preload preview images
  watch(gallery.endIndex, (endIndex, prevIndex) => {
    if (prevIndex >= endIndex) return;
    preloadNextPreviews();

    // Также триггерим подгрузку если скроллим вниз
    onScrollerUpdate();
  });

  return {
    componentRef: gallery.componentRef,
    albumPhotoRef: gallery.albumPhotoRef,
    sizes: gallery.sizes,
    position: gallery.position,
    photos: gallery.grid,
    imagePreloader,
    previewPreloader,
    album: albumInfo.album,
    albumSize,
    albumIsEmpty,
    currentPhoto,
    currentPhotoIndex,
    setCurrentPhotoId,
    setCurrentPhotoIndex,
    isInit: pagination.isInit,
    isLoadingPhotos: pagination.isLoading,
    isLoadingDirectPhoto,
    directPhoto,
    screenError,
    onScrollerUpdate,
    onSwitchPhoto,
  };
}
