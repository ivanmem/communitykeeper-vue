<script lang="ts" setup>
import { useAppCaption } from "@/hooks/useAppCaption";
import AAlbumsPreview from "@/pages/AAlbums/AAlbumsPreview.vue";
import { RecycleScroller } from "vue-virtual-scroller";
import { AlbumsPreviewSizes } from "@/pages/AAlbums/consts";
import { useAlbums } from "@/pages/AAlbums/useAlbums";

useAppCaption("");
const props = defineProps<{ ownerId: number | string }>();
const { isInit, group, albums, isLoadingAlbums, gridItems, onScrollerUpdate } =
  useAlbums(() => props.ownerId);
</script>

<template>
  <div class="a-albums vkuiGroup__inner Group__inner">
    <template v-if="isInit">
      <Teleport to="#caption">
        <a
          v-if="group"
          :href="`//vk.com/albums${props.ownerId}`"
          target="_blank"
        >
          <small>Альбомы</small> {{ group.name }}
        </a>
      </Teleport>
      <RecycleScroller
        ref="albumsRef"
        class="a-albums__items"
        :items="albums"
        :item-size="AlbumsPreviewSizes.height"
        :total-size="albums.length"
        :ready="!isLoadingAlbums"
        :itemSecondarySize="AlbumsPreviewSizes.width"
        :gridItems="gridItems"
        :updateInterval="100"
        emit-update
        key-field="id"
        @update="onScrollerUpdate"
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
