<script lang="ts" setup>
import { useAppCaption } from "@/hooks/useAppCaption";
import { computed, ref, watch } from "vue";
import { useVk } from "@/store/vk/vk";
import { IAlbumItem, PhotosGet, PhotosGetAlbums } from "@/store/vk/IAlbumItem";
import AAlbumPreview from "@/pages/AAlbum/AAlbumPreview.vue";
import APhoto from "@/pages/AAlbum/APhoto.vue";
import { icons } from "@/common/consts";
import { PhotoHelper } from "@/helpers/PhotoHelper";

const props = defineProps<{
  groupId: number | string;
  albumId: number | string;
}>();
const album = ref<IAlbumItem | undefined>();
const photos = ref<PhotosGet | undefined>();

const currentPhotoIndex = ref<number | undefined>();
watch(
  () => props.groupId,
  async () => {
    const albums: PhotosGetAlbums = await useVk().getAlbums(props.groupId);
    album.value = albums.items.find((x) => x.id === +props.albumId);
    photos.value = await useVk().addRequestToQueue({
      method: "photos.get",
      params: {
        album_id: props.albumId,
        owner_id: -props.groupId,
      },
    });
  },
  { immediate: true }
);
const caption = computed(() =>
  album.value ? `Альбом ${album.value.title}` : ""
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
            :href="`//${PhotoHelper.getAlbumUrl(props.groupId, props.albumId)}`"
            target="_blank"
          >
            {{ caption }}
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
