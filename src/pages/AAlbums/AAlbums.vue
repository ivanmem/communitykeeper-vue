<script lang="ts" setup>
import { useAppCaption } from "@/hooks/useAppCaption";
import { computed, ref, watch } from "vue";
import { useVk } from "@/store/vk/vk";
import { IAlbumItem } from "@/store/vk/IAlbumItem";
import { useGroups } from "@/store/groups/groups";
import { IGroup } from "@/store/groups/types";
import AAlbumsPreview from "@/pages/AAlbums/AAlbumsPreview.vue";
import { RecycleScroller } from "vue-virtual-scroller";
import { AlbumsPreviewSizes, getStaticAlbums } from "@/pages/AAlbums/consts";
import { useCountGridColumns } from "@/hooks/useCountGridColumns";

const isInit = ref(false);
const props = defineProps<{ groupId: number | string }>();
const albums = ref<IAlbumItem[]>([]);
const albumsMaxItems = ref(100);
const isLoadingAlbums = ref(false);
const group = ref<IGroup | undefined>();

watch(
  () => props.groupId,
  async () => {
    group.value = await useGroups().getGroupByIdOrLoad(props.groupId);
  },
  { immediate: true },
);

const onScrollerUpdate = (
  startIndex: number,
  endIndex: number,
  visibleStartIndex: number,
  visibleEndIndex: number,
) => {
  if (endIndex + 50 < albumsMaxItems.value) {
    return;
  }

  albumsMaxItems.value += 100;
};

const staticAlbums = computed(() => getStaticAlbums(props.groupId));

watch(
  [() => props.groupId, albumsMaxItems],
  async () => {
    if (isLoadingAlbums.value) {
      return;
    }

    isLoadingAlbums.value = true;
    if (albums.value.length === 0) {
      albums.value.push(...staticAlbums.value);
    }

    const offset = albums.value.length - staticAlbums.value.length;
    const count = albumsMaxItems.value - offset;
    try {
      const { items } = await useVk().getAlbums(props.groupId, offset, count);
      albums.value.push(...items);
    } catch (ex: any) {
      alert(ex.message);
      if (albums.value.length === staticAlbums.value.length) {
        albums.value.length = 0;
      }
    }
    isLoadingAlbums.value = false;
    isInit.value = true;
    albumsRef.value?.updateVisibleItems(true);
  },
  { immediate: true },
);

const albumsRef = ref<InstanceType<typeof RecycleScroller>>();
const gridItems = useCountGridColumns(
  albumsRef,
  () => AlbumsPreviewSizes.value.width,
  20,
);

useAppCaption("");
</script>

<template>
  <div class="a-albums vkuiGroup__inner Group__inner">
    <template v-if="isInit">
      <Teleport to="#caption">
        <a
          v-if="group"
          :href="`//vk.com/albums-${props.groupId}`"
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
