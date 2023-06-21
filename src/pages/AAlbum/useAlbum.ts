import { ref, watch } from "vue/dist/vue";
import { IAlbumItem, PhotosGet, PhotosGetAlbums } from "@/store/vk/IAlbumItem";
import { useVk } from "@/store/vk/vk";
import { toString } from "lodash";
import { getStaticAlbums } from "@/pages/AAlbums/consts";
import { computed, MaybeRefOrGetter, toValue } from "vue";

export function useAlbum(
  groupIdGetter: MaybeRefOrGetter<number | string>,
  albumIdGetter: MaybeRefOrGetter<number | string>
) {
  const groupId = computed(() => toValue(groupIdGetter));
  const albumId = computed(() => toValue(albumIdGetter));
  const album = ref<IAlbumItem | undefined>();
  const photos = ref<PhotosGet | undefined>();
  const currentPhotoIndex = ref<number | undefined>();

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
        photos.value = await useVk().addRequestToQueue({
          method: "photos.get",
          params: {
            album_id: albumId.value,
            owner_id: -groupId.value,
          },
        });
      } catch (ex: any) {
        alert(ex.message);
      }
    },
    { immediate: true }
  );

  return {
    photos,
    album,
    currentPhotoIndex,
  };
}
