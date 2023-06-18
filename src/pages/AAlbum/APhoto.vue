<script lang="ts" setup>
import { IPhoto } from "vkontakte-api";
import { computed, ref, watch } from "vue";
import { PhotoHelper } from "@/helpers/PhotoHelper";

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
</script>
<template>
  <div
    ref="photoDiv"
    class="a-photo"
    :style="{ backgroundImage: `url(${originalSize.url})` }"
    @click="onClick"
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
