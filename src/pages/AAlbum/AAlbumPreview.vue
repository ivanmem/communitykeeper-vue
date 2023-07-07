<script lang="ts" setup>
import { IPhoto } from "vkontakte-api";
import { computed, h } from "vue";
import { PhotoHelper } from "@/helpers/PhotoHelper";
import { showContextMenu } from "@/helpers/showContextMenu";
import { icons } from "@/common/consts";
import { openLink } from "@/helpers/openLink";
import { saveAs } from "file-saver";
import { AlbumsPreviewSizes } from "@/pages/AAlbums/consts";

const props = defineProps<{ photo: IPhoto }>();
const originalSize = computed(() =>
  PhotoHelper.getOriginalSize(props.photo.sizes)
);
const previewSize = computed(() =>
  PhotoHelper.getPreviewSize(props.photo.sizes)
);

const { width, height } = AlbumsPreviewSizes.value;

const onShowContextMenu = (e: MouseEvent) => {
  showContextMenu(e, [
    {
      label: "Открыть оригинал",
      icon: h(icons.Icon16Link),
      onClick: () => {
        if (originalSize.value) {
          openLink(originalSize.value.url);
        }
      },
    },
    {
      label: "Скачать",
      icon: h(icons.Icon16DownloadOutline),
      onClick: () => {
        if (originalSize.value) {
          saveAs(
            originalSize.value.url,
            PhotoHelper.getPhotoFileName(props.photo)
          );
        }
      },
    },
  ]);
};
</script>
<template>
  <div class="photos_row" @contextmenu.stop.prevent="onShowContextMenu">
    <img v-if="previewSize" :src="previewSize.url" alt="" />
    <div class="photos_row__title_wrap"></div>
  </div>
</template>
<style lang="scss">
.photos_row {
  width: v-bind("`${width}px`");
  min-width: v-bind("`${width}px`");
  height: v-bind("`${height}px`");
  min-height: v-bind("`${height}px`");
  display: inline-block;
  vertical-align: top;
  position: relative;
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center 35%;
  background-color: var(--placeholder_icon_background);
  cursor: pointer;

  img {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
}

.photos_row__title_wrap {
  position: absolute;
  bottom: 0;
  width: 100%;
  padding: 35px 12px 9px;
  color: white;

  small {
    opacity: 0.7;
  }
}
</style>
