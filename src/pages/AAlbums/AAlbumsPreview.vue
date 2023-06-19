<script lang="ts" setup>
import { IAlbumItem } from "@/store/vk/IAlbumItem";
import { computed, h } from "vue";
import { PhotoHelper } from "@/helpers/PhotoHelper";
import { router } from "@/router";
import { showContextMenu } from "@/helpers/showContextMenu";
import { icons } from "@/common/consts";
import { openLink } from "@/helpers/openLink";

const props = defineProps<{ album: IAlbumItem }>();
const originalSize = computed(() =>
  PhotoHelper.getOriginalSize(props.album.sizes)
);

const onShowContextMenu = (e: MouseEvent) => {
  showContextMenu(e, [
    {
      label: "Открыть в ВК",
      icon: h(icons.Icon16Link),
      onClick: () => {
        openLink(
          `//${PhotoHelper.getAlbumUrl(-props.album.owner_id, props.album.id)}`
        );
      },
    },
  ]);
};
</script>
<template>
  <div
    class="a-album-item"
    :style="{ backgroundImage: `url(${originalSize.url})` }"
    @click="router.push(`/albums/${-props.album.owner_id}/${props.album.id}`)"
    @contextmenu.stop.prevent="onShowContextMenu"
  >
    <div class="photos_album_title_wrap">{{ props.album.title }}</div>
  </div>
</template>
<style lang="scss">
.a-album-item {
  width: 245px;
  min-width: 245px;
  height: 165px;
  min-height: 165px;
  position: relative;
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center 35%;
  background-color: black;
  cursor: pointer;
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
}
</style>
