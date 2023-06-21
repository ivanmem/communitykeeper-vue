import { IAlbumItem, PhotosGetAlbums } from "@/store/vk/IAlbumItem";
import { useVk } from "@/store/vk/vk";
import { toString } from "lodash";
import { getStaticAlbums } from "@/pages/AAlbums/consts";
import { computed, MaybeRefOrGetter, ref, toValue, watch } from "vue";
import { IPhoto } from "vkontakte-api";
import { useCurrentPhoto } from "@/pages/AAlbum/useCurrentPhoto";
import { useRoute, useRouter } from "vue-router";

export function useAlbum(
  groupIdGetter: MaybeRefOrGetter<number | string>,
  albumIdGetter: MaybeRefOrGetter<number | string>,
  photoIdGetter: MaybeRefOrGetter<number | string | undefined>
) {
  const groupId = computed(() => toValue(groupIdGetter));
  const albumId = computed(() => toValue(albumIdGetter));
  const album = ref<IAlbumItem | undefined>();
  const photos = ref<IPhoto[] | undefined>();
  const { currentPhoto, currentPhotoIndex } = useCurrentPhoto(
    photos,
    photoIdGetter
  );
  const router = useRouter();
  const route = useRoute();

  watch(
    groupId,
    async () => {
      try {
        const albums: PhotosGetAlbums = await useVk().getAlbums(groupId.value);
        album.value =
          albums.items.find(
            (x) => toString(x.id) === toString(albumId.value)
          ) ||
          getStaticAlbums(groupId.value).find(
            (x) => toString(x.id) === toString(albumId.value)
          );
        photos.value = (
          await useVk().addRequestToQueue({
            method: "photos.get",
            params: {
              album_id: albumId.value,
              owner_id: -groupId.value,
            },
          })
        ).items as IPhoto[];
      } catch (ex: any) {
        alert(ex.message);
      }
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
  };
}
