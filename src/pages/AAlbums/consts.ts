import { computed } from "vue";
import { IAlbumItem } from "@/store/vk/IAlbumItem";
import { useApp } from "@/store/app/app";

export const AlbumsPreviewSizesInitial = computed(() => {
  return useApp().platform === "vkcom"
    ? {
        width: 245,
        height: 165,
      }
    : {
        width: 170,
        height: 115,
      };
});

export const wallAlbumStatic = {
  title: "Фотографии сообщества",
  id: -7,
  size: "?",
};

export function getStaticAlbums(owner_id: string | number): IAlbumItem[] {
  return [
    {
      ...wallAlbumStatic,
      owner_id: +owner_id,
    },
  ];
}
