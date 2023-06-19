<script lang="ts" setup>
import { IPhoto } from "vkontakte-api";
import { computed, h } from "vue";
import { PhotoHelper } from "@/helpers/PhotoHelper";
import { showContextMenu } from "@/helpers/showContextMenu";
import { icons } from "@/common/consts";
import { openLink } from "@/helpers/openLink";
import { saveAs } from "file-saver";

const props = defineProps<{ photo: IPhoto }>();
const originalSize = computed(() =>
  PhotoHelper.getOriginalSize(props.photo.sizes)
);

const onShowContextMenu = (e: MouseEvent) => {
  showContextMenu(e, [
    {
      label: "Открыть оригинал",
      icon: h(icons.Icon16Link),
      onClick: () => {
        openLink(originalSize.value.url);
      },
    },
    {
      label: "Скачать",
      icon: h(icons.Icon16DownloadOutline),
      onClick: () => {
        saveAs(
          originalSize.value.url,
          PhotoHelper.getPhotoFileName(props.photo)
        );
      },
    },
  ]);
};
</script>
<template>
  <div
    class="photos_row"
    :style="{ backgroundImage: `url(${originalSize.url})` }"
    @contextmenu.stop.prevent="onShowContextMenu"
  ></div>
</template>
<style lang="scss">
.photos_row {
  display: inline-block;
  vertical-align: top;
  width: 185px;
  height: 127px;
  margin: 2px 3px 3px 2px;
  position: relative;
  background-repeat: no-repeat;
  background-size: cover;
  background-position: center 35%;
  background-color: var(--placeholder_icon_background);
  cursor: pointer;
}
</style>
