import { computed, reactive, watch } from "vue";
import { IAlbumItem } from "@/store/vk/IAlbumItem";
import { useApp } from "@/store/app/app";

export const AlbumsPreviewSizes = reactive({
  width: 1,
  height: 1,
});

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

watch(
  AlbumsPreviewSizesInitial,
  () => {
    Object.assign(AlbumsPreviewSizes, AlbumsPreviewSizesInitial.value);
  },
  { immediate: true },
);

watch(
  () => AlbumsPreviewSizes.width,
  (newWidth, prevWidth) => {
    const height = AlbumsPreviewSizes.height;
    const percent = newWidth / prevWidth;
    AlbumsPreviewSizes.height = height * percent;
  },
  { flush: "sync" },
);

export function getStaticAlbums(owner_id: string | number): IAlbumItem[] {
  return [
    {
      title: "Фото на стене",
      id: "wall",
      size: "?",
      owner_id: +owner_id,
    },
  ];
}
