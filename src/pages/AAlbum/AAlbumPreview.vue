<script lang="ts" setup>
import { IPhoto } from "vkontakte-api";
import { computed, h, toRefs } from "vue";
import { PhotoHelper } from "@/helpers/PhotoHelper";
import { showContextMenu } from "@/helpers/showContextMenu";
import { icons } from "@/common/consts";
import { openLink } from "@/helpers/openLink";
import { saveAs } from "file-saver";
import { AlbumsPreviewSizes } from "@/pages/AAlbums/consts";

const props = defineProps<{ photo: IPhoto }>();
const originalSize = computed(() =>
  PhotoHelper.getOriginalSize(props.photo.sizes),
);
const previewSize = computed(() =>
  PhotoHelper.getPreviewSize(props.photo.sizes),
);

const { width, height } = toRefs(AlbumsPreviewSizes);

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
            PhotoHelper.getPhotoFileName(props.photo),
          );
        }
      },
    },
  ]);
};
</script>
<template>
  <div
    class="a-not-dragable-and-not-select photos_row"
    @contextmenu.stop.prevent="onShowContextMenu"
  >
    <img
      v-if="previewSize"
      :src="previewSize.url"
      alt=""
      class="a-not-dragable-and-not-select"
    />
    <div class="a-not-dragable-and-not-select photos_row__title_wrap"></div>
  </div>
</template>
<style lang="scss">
.photos_row {
  background-color: var(--placeholder_icon_background);
  background-position: center 35%;
  background-repeat: no-repeat;
  background-size: cover;
  cursor: pointer;
  display: inline-block;
  height: v-bind("`${height}px`");
  min-height: v-bind("`${height}px`");
  min-width: v-bind("`${width}px`");
  position: relative;
  vertical-align: top;
  width: v-bind("`${width}px`");

  img {
    height: 100%;
    object-fit: cover;
    width: 100%;
  }
}

.photos_row__title_wrap {
  bottom: 0;
  box-shadow: -2px -2px 4px 0px rgba(0, 0, 0, 0.4) inset;
  color: white;
  left: 0;
  padding: 35px 12px 9px;
  position: absolute;
  right: 0;
  top: 0;

  small {
    opacity: 0.7;
  }
}
</style>
