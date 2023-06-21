<script lang="ts" setup>
import { useAppCaption } from "@/hooks/useAppCaption";
import AAlbumPreview from "@/pages/AAlbum/AAlbumPreview.vue";
import APhoto from "@/pages/AAlbum/APhoto.vue";
import { icons } from "@/common/consts";
import { PhotoHelper } from "@/helpers/PhotoHelper";
import { useAlbum } from "@/pages/AAlbum/useAlbum";
import { AlbumsPreviewSizes } from "@/pages/AAlbums/consts";
import { RecycleScroller } from "vue-virtual-scroller";

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
  onScrollerUpdate,
  isInit,
  screenError,
  albumRef,
  gridItems,
  isLoadingPhotos,
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
    <template v-if="isInit">
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
      <RecycleScroller
        ref="albumRef"
        class="a-album__items"
        :items="photos"
        :item-size="AlbumsPreviewSizes.height"
        :total-size="photos.length"
        :ready="!isLoadingPhotos"
        :itemSecondarySize="AlbumsPreviewSizes.width"
        :gridItems="gridItems"
        :updateInterval="100"
        emit-update
        key-field="id"
        @update="onScrollerUpdate"
        v-slot="{ item, index }"
      >
        <AAlbumPreview
          :key="item.id"
          :photo="item"
          :index="index"
          @click="setCurrentPhotoIndex(index)"
        />
      </RecycleScroller>
      <APhoto
        v-if="currentPhoto"
        :photo="currentPhoto"
        @photo:prev="setCurrentPhotoIndex(currentPhotoIndex! - 1)"
        @photo:next="setCurrentPhotoIndex(currentPhotoIndex! + 1)"
        @photo:exit="setCurrentPhotoIndex(undefined)"
      />
    </template>
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
  padding: 10px;
}
</style>
