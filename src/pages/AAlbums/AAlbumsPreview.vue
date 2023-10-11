<script lang="ts" setup>
import { IAlbumItem } from "@/store/vk/IAlbumItem";
import { computed, h, toRefs } from "vue";
import { PhotoHelper } from "@/helpers/PhotoHelper";
import { router } from "@/router";
import { showContextMenu } from "@/helpers/showContextMenu";
import { icons } from "@/common/consts";
import { openLink } from "@/helpers/openLink";
import { AlbumsPreviewSizes } from "@/pages/AAlbums/consts";

const props = defineProps<{ album: IAlbumItem }>();
const previewSize = computed(() =>
  PhotoHelper.getPreviewSize(props.album.sizes),
);

const { width, height } = toRefs(AlbumsPreviewSizes);

const onShowContextMenu = (e: MouseEvent) => {
  showContextMenu(e, [
    {
      label: "Перейти к фото",
      icon: h(icons.Icon16LogoVk),
      onClick: () => {
        openLink(
          `//${PhotoHelper.getAlbumUrl(props.album.owner_id, props.album.id)}`,
        );
      },
    },
  ]);
};
</script>
<template>
  <div
    class="a-album-item"
    @click="router.push(`/albums/${props.album.owner_id}/${props.album.id}`)"
    @contextmenu.stop.prevent="onShowContextMenu"
  >
    <img v-if="previewSize" :src="previewSize.url" alt="" />
    <div class="photos_album_title_wrap">
      <div class="photos_album_title_name">
        {{ props.album.title }}
      </div>
      <small>
        {{ props.album.size }}
      </small>
    </div>
  </div>
</template>
<style lang="scss">
.a-album-item {
  background-color: black;
  background-position: center 35%;
  background-repeat: no-repeat;
  background-size: cover;
  cursor: pointer;
  height: v-bind("`${height}px`");
  min-height: v-bind("`${height}px`");
  min-width: v-bind("`${width}px`");
  position: relative;
  width: v-bind("`${width}px`");

  img {
    height: 100%;
    object-fit: cover;
    width: 100%;
  }
}

.photos_album_title_wrap {
  background: rgb(2, 0, 36);
  background: linear-gradient(
    0deg,
    rgba(2, 0, 36, 0.8968181022408963) 12%,
    rgba(255, 255, 255, 0) 100%
  );
  bottom: 0;
  box-shadow: -2px -2px 4px 0px rgba(0, 0, 0, 0.4) inset;
  color: white;
  display: flex;
  flex-direction: column;
  justify-content: end;
  left: 0;
  padding: 35px 12px 9px;
  position: absolute;
  right: 0;

  text-shadow: 1px 2px 4px rgba(0, 0, 0, 0.78);
  top: 0;

  small {
    opacity: 0.7;
  }
}

.photos_album_title_name {
  -webkit-box-orient: vertical;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  overflow: hidden;
  width: 100%;
}
</style>
