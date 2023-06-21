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

export function useAlbum(
  ownerIdGetter: MaybeRefOrGetter<number | string>,
  albumIdGetter: MaybeRefOrGetter<number | string>,
  photoIdGetter: MaybeRefOrGetter<number | string | undefined>
) {
  const ownerId = computed(() => toValue(ownerIdGetter));
  const albumId = computed(() => toValue(albumIdGetter));
  const album = ref<IAlbumItem | undefined>();
  const photos = ref<IPhoto[]>([]);
  const { currentPhoto, currentPhotoIndex } = useCurrentPhoto(
    photos,
    photoIdGetter
  );
  const albumRef = ref<InstanceType<typeof RecycleScroller>>();
  const gridItems = useCountGridColumns(
    albumRef,
    () => AlbumsPreviewSizes.value.width,
    20
  );
  const router = useRouter();
  const route = useRoute();
  const screenError = ref<any>();
  const isInit = ref(false);
  const isLoadingPhotos = ref(false);
  const photosMaxItems = ref(0);
  const countOneLoad = 100;
  useScreenSpinner(() => !isInit.value);

  const onClearComponent = () => {
    isInit.value = false;
    album.value = undefined;
    screenError.value = undefined;
    photos.value.length = 0;
    photosMaxItems.value = 0;
  };

  watch(
    ownerId,
    async () => {
      onClearComponent();
      const albums: PhotosGetAlbums = await useVk().getAlbums(ownerId.value);
      album.value =
        albums.items.find((x) => toString(x.id) === toString(albumId.value)) ||
        getStaticAlbums(ownerId.value).find(
          (x) => toString(x.id) === toString(albumId.value)
        );
      photosMaxItems.value = countOneLoad; // это инициирует первую загрузку
    },
    { immediate: true }
  );
  watch(
    photosMaxItems,
    async () => {
      if (isLoadingPhotos.value || photosMaxItems.value === 0) {
        return;
      }

      isLoadingPhotos.value = true;
      screenError.value = undefined;
      const offset = photos.value.length;
      const count = photosMaxItems.value - offset;
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

  const onScrollerUpdate = (
    startIndex: number,
    endIndex: number,
    visibleStartIndex: number,
    visibleEndIndex: number
  ) => {
    if (endIndex + countOneLoad / 2 < photosMaxItems.value) {
      return;
    }

    photosMaxItems.value += countOneLoad;
  };

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
  };
}
