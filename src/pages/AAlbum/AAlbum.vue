<script lang="ts" setup>
import { useAppCaption } from "@/hooks/useAppCaption";
import AAlbumPreview from "@/pages/AAlbum/AAlbumPreview.vue";
import APhoto from "@/pages/AAlbum/APhoto.vue";
import { icons } from "@/common/consts";
import { PhotoHelper } from "@/helpers/PhotoHelper";
import { useAlbum } from "@/pages/AAlbum/useAlbum";

const props = defineProps<{
  groupId: number | string;
  albumId: number | string;
}>();

const { photos, album, currentPhotoIndex } = useAlbum(
  () => props.groupId,
  () => props.albumId
);

useAppCaption("");
const { Icon16Link } = icons;
</script>

<template>
  <div class="a-album vkuiGroup__inner Group__inner">
    <div v-if="photos" class="a-album__items">
      <Teleport to="#caption">
        <div style="display: flex; gap: 5px; align-items: center">
          <Icon16Link />
          <a
            v-if="album"
            :href="`//${PhotoHelper.getAlbumUrl(props.groupId, props.albumId)}`"
            target="_blank"
          >
            <small>Альбом</small> {{ album.title }}
          </a>
        </div>
      </Teleport>
      <AAlbumPreview
        v-for="(photo, index) of photos.items"
        :key="photo.id"
        :photo="photo"
        :index="index"
        @click="currentPhotoIndex = index"
      />
    </div>
    <APhoto
      v-if="
        photos &&
        currentPhotoIndex !== undefined &&
        photos.items[currentPhotoIndex]
      "
      :photo="photos.items[currentPhotoIndex]"
      @photo:prev="currentPhotoIndex--"
      @photo:next="currentPhotoIndex++"
      @photo:exit="currentPhotoIndex = undefined"
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
