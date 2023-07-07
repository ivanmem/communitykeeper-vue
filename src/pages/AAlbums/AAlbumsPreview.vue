<script lang="ts" setup>
import { IAlbumItem } from "@/store/vk/IAlbumItem";
import { computed, h } from "vue";
import { PhotoHelper } from "@/helpers/PhotoHelper";
import { router } from "@/router";
import { showContextMenu } from "@/helpers/showContextMenu";
import { icons } from "@/common/consts";
import { openLink } from "@/helpers/openLink";
import { AlbumsPreviewSizes } from "@/pages/AAlbums/consts";

const props = defineProps<{ album: IAlbumItem }>();
const previewSize = computed(() =>
  PhotoHelper.getPreviewSize(props.album.sizes)
);

const { width, height } = AlbumsPreviewSizes.value;

const onShowContextMenu = (e: MouseEvent) => {
  showContextMenu(e, [
    {
      label: "Открыть в ВК",
      icon: h(icons.Icon16Link),
      onClick: () => {
        openLink(
          `//${PhotoHelper.getAlbumUrl(props.album.owner_id, props.album.id)}`
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
      <div>
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
  width: v-bind("`${width}px`");
  min-width: v-bind("`${width}px`");
  height: v-bind("`${height}px`");
  min-height: v-bind("`${height}px`");
  position: relative;
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center 35%;
  background-color: black;
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.photos_album_title_wrap {
  position: absolute;
  bottom: 0;
  width: 100%;
  padding: 35px 12px 9px;
  background: rgb(2, 0, 36);
  background: linear-gradient(
    0deg,
    rgba(2, 0, 36, 0.8968181022408963) 12%,
    rgba(255, 255, 255, 0) 100%
  );
  color: white;

  small {
    opacity: 0.7;
  }
}
</style>
