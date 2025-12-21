import { computed } from "vue";
import { IAlbumItem } from "@/store/vk/IAlbumItem";
import { useApp } from "@/store/app/app";
import { t } from "@/i18n";

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

export function getWallAlbumTitle(): string {
  return t("albums.communityPhotos");
}

export const wallAlbumStatic = {
  get title() {
    return getWallAlbumTitle();
  },
  id: -7,
  size: "?",
};

export function getStaticAlbums(owner_id: string | number): IAlbumItem[] {
  return [
    {
      ...wallAlbumStatic,
      title: getWallAlbumTitle(),
      owner_id: +owner_id,
    },
  ];
}
