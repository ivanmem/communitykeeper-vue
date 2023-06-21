import { IAlbumItem, PhotosGetAlbums } from "@/store/vk/IAlbumItem";
import { useVk } from "@/store/vk/vk";
import { toString } from "lodash";
import { getStaticAlbums } from "@/pages/AAlbums/consts";
import { computed, MaybeRefOrGetter, ref, toValue, watch } from "vue";
import { IPhoto } from "vkontakte-api";
import { useCurrentPhoto } from "@/pages/AAlbum/useCurrentPhoto";
import { useRoute, useRouter } from "vue-router";
import { useScreenSpinner } from "@/hooks/useScreenSpinner";

export function useAlbum(
  ownerIdGetter: MaybeRefOrGetter<number | string>,
  albumIdGetter: MaybeRefOrGetter<number | string>,
  photoIdGetter: MaybeRefOrGetter<number | string | undefined>
) {
  const ownerId = computed(() => toValue(ownerIdGetter));
  const albumId = computed(() => toValue(albumIdGetter));
  const album = ref<IAlbumItem | undefined>();
  const photos = ref<IPhoto[] | undefined>();
  const { currentPhoto, currentPhotoIndex } = useCurrentPhoto(
    photos,
    photoIdGetter
  );
  const router = useRouter();
  const route = useRoute();
  const screenError = ref<any>();
  const isInit = ref(false);
  useScreenSpinner(() => !isInit.value);

  const onClearComponent = () => {
    isInit.value = false;
    photos.value = undefined;
    album.value = undefined;
    screenError.value = undefined;
  };

  watch(
    ownerId,
    async () => {
      try {
        onClearComponent();
        const albums: PhotosGetAlbums = await useVk().getAlbums(ownerId.value);
        album.value =
          albums.items.find(
            (x) => toString(x.id) === toString(albumId.value)
          ) ||
          getStaticAlbums(ownerId.value).find(
            (x) => toString(x.id) === toString(albumId.value)
          );
        photos.value = (
          await useVk().addRequestToQueue({
            method: "photos.get",
            params: {
              album_id: albumId.value,
              owner_id: ownerId.value,
            },
          })
        ).items as IPhoto[];
        screenError.value = undefined;
      } catch (ex: any) {
        alert(ex.message);
        screenError.value = ex;
      }
      isInit.value = true;
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

  return {
    photos,
    album,
    currentPhoto,
    currentPhotoIndex,
    setCurrentPhotoId,
    setCurrentPhotoIndex,
    isInit,
    screenError,
  };
}
