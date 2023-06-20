import { computed } from "vue";
import { platform } from "@vkontakte/vkui";
import { IAlbumItem } from "@/store/vk/IAlbumItem";

export const AlbumsPreviewSizes = computed(() => {
  const plaftorm = platform();
  if (plaftorm === "vkcom") {
    return {
      width: 245,
      height: 165,
    };
  } else {
    return {
      width: 170,
      height: 115,
    };
  }
});

export function getStaticAlbums(groupId: string | number): IAlbumItem[] {
  return [
    {
      title: "Фото на стене",
      id: "wall",
      size: "?",
      owner_id: -groupId,
    },
  ];
}
