<script lang="ts" setup>
import { useAppCaption } from "@/hooks/useAppCaption";
import AAlbumPreview from "@/pages/AAlbum/AAlbumPreview.vue";
import APhoto from "@/pages/AAlbum/APhoto.vue";
import { icons } from "@/common/consts";
import { PhotoHelper } from "@/helpers/PhotoHelper";
import { useAlbum } from "@/pages/AAlbum/useAlbum";

const props = defineProps<{
  ownerId: number | string;
  albumId: number | string;
  photoId: number | string | undefined;
}>();

const {
  photos,
  album,
  currentPhoto,
  setCurrentPhotoIndex,
  currentPhotoIndex,
  isInit,
  screenError,
} = useAlbum(
  () => props.ownerId,
  () => props.albumId,
  () => props.photoId
);
useAppCaption("");
const { Icon16Link } = icons;
</script>

<template>
  <div class="a-album vkuiGroup__inner Group__inner">
    <code
      v-if="screenError"
      style="padding: 10px"
      class="vkuiFormField--status-error"
    >
      {{ screenError }}
    </code>
    <div v-if="photos && isInit" class="a-album__items">
      <Teleport to="#caption">
        <div style="display: flex; gap: 5px; align-items: center">
          <Icon16Link />
          <a
            v-if="album"
            :href="`//${PhotoHelper.getAlbumUrl(props.ownerId, props.albumId)}`"
            target="_blank"
          >
            <small>Альбом</small> {{ album.title }}
          </a>
        </div>
      </Teleport>
      <AAlbumPreview
        v-for="(photo, index) of photos"
        :key="photo.id"
        :photo="photo"
        :index="index"
        @click="setCurrentPhotoIndex(index)"
      />
    </div>
    <APhoto
      v-if="currentPhoto"
      :photo="currentPhoto"
      @photo:prev="setCurrentPhotoIndex(currentPhotoIndex - 1)"
      @photo:next="setCurrentPhotoIndex(currentPhotoIndex + 1)"
      @photo:exit="setCurrentPhotoIndex(undefined)"
    />
  </div>
</template>

<style lang="scss">
.a-album {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: auto;
  gap: 5px;
  background: var(--vkui--color_background_content);
  color: var(--vkui--color_text_primary);
}

.a-album__items {
  display: flex;
  flex-grow: 1;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
  overflow-x: auto;
  justify-content: space-evenly;
}
</style>
