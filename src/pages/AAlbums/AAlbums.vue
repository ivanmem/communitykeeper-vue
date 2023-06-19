<script lang="ts" setup>
import { useAppCaption } from "@/hooks/useAppCaption";
import { computed, ref, watch } from "vue";
import { useVk } from "@/store/vk/vk";
import { PhotosGetAlbums } from "@/store/vk/IAlbumItem";
import { useGroups } from "@/store/groups/groups";
import { IGroup } from "@/store/groups/types";
import AAlbumsPreview from "@/pages/AAlbums/AAlbumsPreview.vue";
import { RecycleScroller } from "vue-virtual-scroller";
import { AlbumsPreviewSizes } from "@/pages/AAlbums/consts";
import { useCountGridColumns } from "@/hooks/useCountGridColumns";

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
useAppCaption("");

watch(
  () => props.groupId,
  async () => {
    albums.value = await useVk().getAlbums(props.groupId);
  },
  { immediate: true }
);

const albumsRef = ref();
const albumsDiv = computed(() => albumsRef.value?.$el);
const gridItems = useCountGridColumns(
  albumsDiv,
  () => AlbumsPreviewSizes.value.width,
  20
);
</script>

<template>
  <div class="a-albums vkuiGroup__inner Group__inner">
    <template v-if="albums">
      <Teleport to="#caption">
        <a :href="`//vk.com/public${props.groupId}`" target="_blank">
          {{ caption }}
        </a>
      </Teleport>
      <RecycleScroller
        ref="albumsRef"
        class="a-albums__items"
        :items="albums.items"
        :item-size="AlbumsPreviewSizes.height"
        :itemSecondarySize="AlbumsPreviewSizes.width"
        :gridItems="gridItems"
        key-field="id"
        v-slot="{ item, index }"
      >
        <AAlbumsPreview :key="item.id" :album="item" :index="index" />
      </RecycleScroller>
    </template>

    <div></div>
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
  padding: 10px;
}

.a-albums__header {
  display: block;
  padding: 8px var(--vkui--size_base_padding_horizontal--regular);
  border-bottom: 1px solid currentColor;
}
</style>
