import { IAlbumItem, PhotosGetAlbums } from "@/store/vk/IAlbumItem";
import { useVk } from "@/store/vk/vk";
import { toString } from "lodash";
import { AlbumsPreviewSizes, getStaticAlbums } from "@/pages/AAlbums/consts";
import { computed, MaybeRefOrGetter, ref, toValue, watch } from "vue";
import { IPhoto } from "vkontakte-api";
import { useCurrentPhoto } from "@/pages/AAlbum/useCurrentPhoto";
import { useRoute, useRouter } from "vue-router";
import { useScreenSpinner } from "@/hooks/useScreenSpinner";
import { useCountGridColumns } from "@/hooks/useCountGridColumns";
import { RecycleScroller } from "vue-virtual-scroller";
import { toStr } from "@/helpers/toStr";

const countOneLoad = 100;

export function useAlbum(
  ownerIdGetter: MaybeRefOrGetter<number | string>,
  albumIdGetter: MaybeRefOrGetter<number | string>,
  photoIdGetter: MaybeRefOrGetter<number | string | undefined>
) {
  const ownerId = computed(() => toValue(ownerIdGetter));
  const albumId = computed(() => toValue(albumIdGetter));
  const photoId = computed(() => toValue(photoIdGetter));
  const album = ref<IAlbumItem | undefined>();
  const photos = ref<IPhoto[]>([]);
  const { currentPhoto, currentPhotoIndex } = useCurrentPhoto(photos, photoId);
  const albumRef = ref<InstanceType<typeof RecycleScroller>>();
  const gridItems = useCountGridColumns(
    albumRef,
    () => AlbumsPreviewSizes.value.width
  );
  const router = useRouter();
  const route = useRoute();
  const screenError = ref<any>();
  const isInit = ref(false);
  const isLoadingPhotos = ref(false);
  const isLoadAllPhotos = ref(false);
  const photosMaxItems = ref(0);
  useScreenSpinner(() => !isInit.value);

  const onClearComponent = () => {
    isInit.value = false;
    album.value = undefined;
    screenError.value = undefined;
    photos.value.length = 0;
    photosMaxItems.value = 0;
    isLoadAllPhotos.value = false;
  };

  watch(
    ownerId,
    async () => {
      onClearComponent();
      const albums: PhotosGetAlbums["items"] =
        albumId.value === "wall"
          ? []
          : (
              await useVk()
                .getAlbums(ownerId.value)
                .catch((ex) => {
                  if (ex?.errorInfo && ex.errorInfo.error_code !== 15) {
                    screenError.value = ex;
                    console.warn("Необработанная ошибка:", ex.errorInfo);
                  }
                  return { items: [], count: 0 };
                })
            ).items;
      albums.push(...getStaticAlbums(ownerId.value));
      album.value = albums.find(
        (x) => toString(x.id) === toString(albumId.value)
      );

      photosMaxItems.value = countOneLoad; // это инициирует первую загрузку
    },
    { immediate: true }
  );
  watch(
    photosMaxItems,
    async () => {
      const maxItems = photosMaxItems.value;
      if (isLoadingPhotos.value || maxItems === 0 || isLoadAllPhotos.value) {
        return;
      }

      isLoadingPhotos.value = true;
      screenError.value = undefined;
      const offset = photos.value.length;
      const count = maxItems - offset;
      try {
        const { items }: { items: IPhoto[] } = await useVk().addRequestToQueue({
          method: "photos.get",
          params: {
            album_id: albumId.value,
            owner_id: ownerId.value,
            offset,
            count,
          },
        });
        if (items.length === 0) {
          isLoadAllPhotos.value = true;
        }

        photos.value.push(...items);
      } catch (ex: any) {
        alert(ex.message);
        screenError.value = ex;
      }
      isInit.value = true;
      isLoadingPhotos.value = false;
      albumRef.value?.updateVisibleItems(true);
    },
    { immediate: true }
  );

  const setCurrentPhotoId = async (photoId: number | string | undefined) => {
    await router.replace({
      params: { ...route.params, photoId: photoId ?? "" },
    });
  };

  const setCurrentPhotoIndex = (index: number | undefined) => {
    return setCurrentPhotoId(
      index === undefined ? undefined : photos.value?.[index]?.id
    );
  };

  const onMoreLoad = () => {
    // защищаем от переполнения
    if (
      photosMaxItems.value - photos.value.length < 1000 &&
      !isLoadAllPhotos.value
    ) {
      photosMaxItems.value += countOneLoad;
    }
  };
  const onScrollerUpdate = (
    startIndex: number,
    endIndex: number,
    visibleStartIndex: number,
    visibleEndIndex: number
  ) => {
    if (endIndex + countOneLoad / 3 < photosMaxItems.value) {
      return;
    }

    onMoreLoad();
  };

  watch(
    [photoId, isLoadingPhotos],
    () => {
      if (toStr(photoId.value).length && !isLoadingPhotos.value) {
        if (currentPhotoIndex.value !== undefined) {
          albumRef.value?.scrollToItem(currentPhotoIndex.value);
        } else if (!screenError.value) {
          onMoreLoad();
        }
      }
    },
    { immediate: true, deep: true }
  );

  return {
    photos,
    album,
    currentPhoto,
    currentPhotoIndex,
    setCurrentPhotoId,
    setCurrentPhotoIndex,
    isInit,
    isLoadingPhotos,
    screenError,
    onScrollerUpdate,
    albumRef,
    gridItems,
    isLoadAllPhotos,
  };
}
