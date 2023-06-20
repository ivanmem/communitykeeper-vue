<script lang="ts" setup>
import { IPhoto } from "vkontakte-api";
import { computed, h, ref, watch } from "vue";
import { PhotoHelper } from "@/helpers/PhotoHelper";
import { showContextMenu } from "@/helpers/showContextMenu";
import { openLink } from "@/helpers/openLink";
import { icons } from "@/common/consts";
import { saveAs } from "file-saver";

const emit = defineEmits<{
  (e: "photo:prev"): void;
  (e: "photo:next"): void;
  (e: "photo:exit"): void;
}>();

const props = defineProps<{ photo: IPhoto }>();
const originalSize = computed(() =>
  PhotoHelper.getOriginalSize(props.photo.sizes)
);

const onClick = (event: MouseEvent) => {
  const clickX = event.offsetX;

  const imageWidth = (event.target as HTMLDivElement).clientWidth;
  const centerWidth = imageWidth / 3;
  if (clickX >= centerWidth && clickX <= centerWidth * 2) {
    emit("photo:exit");
    return;
  }
  const imageCenterX = imageWidth / 2;
  // Сравниваем координату клика с центром изображения
  if (clickX <= imageCenterX) {
    emit("photo:prev");
    return;
  }

  emit("photo:next");
  return;
};
const photoDiv = ref<HTMLDivElement>();

watch(photoDiv, () => {
  if (photoDiv.value) {
    photoDiv.value.focus();
  }
});

const onShowContextMenu = (e: MouseEvent) => {
  showContextMenu(e, [
    {
      label: "Открыть в ВК",
      icon: h(icons.Icon16Link),
      onClick: () => {
        openLink(`//vk.com/photo${props.photo.owner_id}_${props.photo.id}`);
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
    {
      label: "Выйти из полного экрана (нажмите по центру экрана)",
      icon: h(icons.Icon16DoorEnterArrowRightOutline),
      onClick: () => {
        emit("photo:exit");
      },
    },
  ]);
};
</script>
<template>
  <div
    ref="photoDiv"
    tabindex="1"
    class="a-photo"
    :style="{ backgroundImage: `url(${originalSize?.url})` }"
    @click="onClick"
    @contextmenu.prevent.stop="onShowContextMenu"
    @keydown.stop.prevent.esc="emit('photo:exit')"
    @keydown.stop.prevent.space="emit('photo:exit')"
    @keydown.stop.prevent.left="emit('photo:prev')"
    @keydown.stop.prevent.right="emit('photo:next')"
  ></div>
</template>
<style lang="scss">
.a-photo {
  z-index: 1;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: inline-block;
  vertical-align: top;
  margin: 2px 3px 3px 2px;
  background-repeat: no-repeat;
  background-size: contain;
  background-position: center 35%;
  background-color: black;
  cursor: pointer;
  outline: none !important;
  -webkit-tap-highlight-color: transparent !important;
}
</style>
