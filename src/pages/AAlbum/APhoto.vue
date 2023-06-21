<script lang="ts" setup>
import { IPhoto } from "vkontakte-api";
import { computed, h, ref, watch } from "vue";
import { PhotoHelper } from "@/helpers/PhotoHelper";
import { showContextMenu } from "@/helpers/showContextMenu";
import { openLink } from "@/helpers/openLink";
import { icons } from "@/common/consts";
import { saveAs } from "file-saver";
import { MenuItem } from "@imengyu/vue3-context-menu";
import { switchFullscreen } from "@/helpers/switchFullscreen";
import { useApp } from "@/store/app/app";

const emit = defineEmits<{
  (e: "photo:prev"): void;
  (e: "photo:next"): void;
  (e: "photo:exit"): void;
}>();

const props = defineProps<{
  photo: IPhoto;
  index?: number;
  count?: number | string;
}>();

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
const showInfo = ref(true);

watch(photoDiv, () => {
  if (photoDiv.value) {
    photoDiv.value.focus();
  }
});

let timeoutShowInfo: any = undefined;

watch(
  () => props.photo,
  () => {
    clearTimeout(timeoutShowInfo);
    showInfo.value = true;
    timeoutShowInfo = setTimeout(() => {
      showInfo.value = false;
    }, 2000);
  },
  { immediate: true }
);

const onShowContextMenu = (e: MouseEvent) => {
  const items: MenuItem[] = [
    {
      label: "Открыть в ВК",
      icon: h(icons.Icon16Link),
      onClick: () => {
        openLink(
          `//${PhotoHelper.getPhotoUrl(props.photo.owner_id, props.photo.id)}`
        );
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
      label: "Полный экран",
      icon: h(
        useApp().isFullScreen
          ? icons.Icon24FullscreenExit
          : icons.Icon24Fullscreen,
        { width: "16px", height: "16px" }
      ),
      onClick: () => {
        switchFullscreen();
      },
    },
    {
      label: "Выйти из просмотра фото",
      icon: h(icons.Icon16DoorEnterArrowRightOutline),
      onClick: () => {
        emit("photo:exit");
      },
    },
  ];
  showContextMenu(e, items);
};

const onWheel = (e: WheelEvent) => {
  const delta = e.deltaY || e.detail;
  if (delta > 0) {
    emit("photo:next");
  } else {
    emit("photo:prev");
  }
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
    @wheel="onWheel"
    @click.middle="emit('photo:exit')"
  >
    <div v-if="showInfo && index !== undefined" class="a-photo__info">
      {{ index + 1 }} из {{ count ?? "?" }}
    </div>
  </div>
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
}

.a-photo__info {
  display: flex;
  flex-direction: column;
  width: max-content;
  height: max-content;
  margin-top: 5px;
  margin-left: 10px;
  background-color: rgba(0, 0, 0, 0.3);
  pointer-events: none;
  user-select: none;
  border-radius: 10px;
  padding: 3px;
  color: white;
}
</style>
