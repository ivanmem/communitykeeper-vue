<script lang="ts" setup>
import { useAlbums } from "@/pages/Albums/useAlbums";
import AlbumsBreadcrumbs from "./AlbumsBreadcrumbs.vue";
import AlbumsList from "./AlbumsList.vue";
import ImagePreloader from "@/components/ImagePreloader";
import AError from "@/components/AError";

const props = defineProps<{ ownerId: number | string }>();
const {
  isInit,
  group,
  albums,
  previewPreloader,
  onScrollerUpdate,
  componentRef,
  screenError,
  sizes,
} = useAlbums(() => props.ownerId);
</script>

<template>
  <div class="a-albums">
    <template v-if="isInit">
      <AlbumsBreadcrumbs :group-name="group?.name" :owner-id="ownerId" />
      <div class="a-albums__details">
        <AError v-if="screenError">{{ screenError }}</AError>
      </div>
      <AlbumsList
        v-model:component-ref="componentRef"
        :albums="albums"
        :sizes="sizes"
        @scroll="onScrollerUpdate"
      />
    </template>
    <ImagePreloader :photos="previewPreloader.photos.value" />
  </div>
</template>

<style lang="scss">
.a-albums {
  background: var(--vkui--color_background_content);
  color: var(--vkui--color_text_primary);
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 5px;
  overflow: auto;

  &__details {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding-inline: 16px;
  }
}
</style>
