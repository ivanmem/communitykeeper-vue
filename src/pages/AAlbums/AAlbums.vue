<script lang="ts" setup>
import { useAppCaption } from "@/hooks/useAppCaption";
import { computed, ref, watch } from "vue";
import { useVk } from "@/store/vk/vk";
import { PhotosGetAlbums } from "@/store/vk/IAlbumItem";
import { useGroups } from "@/store/groups/groups";
import { IGroup } from "@/store/groups/types";
import AAlbumsPreview from "@/pages/AAlbums/AAlbumsPreview.vue";

const props = defineProps<{ groupId: number | string }>();

const albums = ref<PhotosGetAlbums | undefined>();

const group = ref<IGroup | undefined>();
watch(
  () => props.groupId,
  async () => {
    group.value = await useGroups().getGroupByIdOrLoad(props.groupId);
  },
  { immediate: true }
);
const caption = computed(() =>
  group.value ? `Альбомы ${group.value.name}` : ""
);
useAppCaption(caption);

watch(
  () => props.groupId,
  async () => {
    const result: PhotosGetAlbums = await useVk().addRequestToQueue({
      method: "photos.getAlbums",
      params: {
        owner_id: -props.groupId,
        need_system: 1,
        need_covers: 1,
        photo_sizes: 1,
      },
    });
    albums.value = result;
  },
  { immediate: true }
);
</script>

<template>
  <div class="a-albums vkuiGroup__inner Group__inner">
    <div v-if="albums" class="a-albums__items">
      <AAlbumsPreview
        v-for="(album, index) of albums.items"
        :key="album.id"
        :album="album"
        :index="index"
      />
    </div>
  </div>
</template>

<style lang="scss">
.a-albums {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: auto;
  gap: 5px;
  background: var(--vkui--color_background_content);
  color: var(--vkui--color_text_primary);
}

.a-albums__items {
  display: flex;
  flex-grow: 1;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
  overflow-x: auto;
  justify-content: space-evenly;
}

.a-albums__header {
  display: block;
  padding: 8px var(--vkui--size_base_padding_horizontal--regular);
  border-bottom: 1px solid currentColor;
}
</style>
