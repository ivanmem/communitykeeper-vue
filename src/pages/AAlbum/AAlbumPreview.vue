<script lang="ts" setup>
import { IPhoto } from "vkontakte-api";
import { computed } from "vue";
import { PhotoHelper } from "@/helpers/PhotoHelper";

const props = defineProps<{ photo: IPhoto }>();
const originalSize = computed(() =>
  PhotoHelper.getOriginalSize(props.photo.sizes)
);
</script>
<template>
  <div
    class="photos_row"
    :style="{ backgroundImage: `url(${originalSize.url})` }"
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
