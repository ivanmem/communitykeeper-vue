<script lang="ts" setup>
import { computed } from "vue";
import { useAppCaption } from "@/composables/useAppCaption";
import AAlbumsPreview from "@/pages/AAlbums/AAlbumsPreview.vue";
import { RecycleScroller } from "vue-virtual-scroller";
import { AlbumsPreviewSizes } from "@/pages/AAlbums/consts";
import { useAlbums } from "@/pages/AAlbums/useAlbums";
import { icons } from "@/common/consts";
import { openLink } from "@/helpers/openLink";
import { PhotoHelper } from "@/helpers/PhotoHelper";

useAppCaption("Галерея: Альбомы");
const props = defineProps<{ ownerId: number | string }>();
const {
  isInit,
  group,
  albums,
  isLoadingAlbums,
  gridItems,
  onScrollerUpdate,
  albumsRef,
  screenError,
} = useAlbums(() => props.ownerId);
const { Icon16Link } = icons;
const ownerUrl = computed(() => PhotoHelper.getOwnerUrl(props.ownerId));
</script>

<template>
  <div class="a-albums vkuiGroup__inner Group__inner">
    <template v-if="isInit">
      <VBreadcrumbs style="padding-left: 0" density="compact">
        <VBreadcrumbsItem
          style="padding-left: 0"
          replace
          to="/"
          title="Группы"
        />
        <VIcon size="small" icon="mdi-chevron-right" />
        <VBreadcrumbsItem
          style="opacity: 0.7"
          :href="`https://${ownerUrl}`"
          :title="group?.name ?? 'Источник'"
          @click.prevent="openLink(`//${ownerUrl}`)"
        />
      </VBreadcrumbs>
      <code v-if="screenError" class="vkuiFormField--status-error">
        {{ screenError }}
      </code>
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
  padding-inline: 10px;
}

.a-albums__items {
  display: flex;
  flex-grow: 1;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 5px;
  overflow-x: auto;
  justify-content: space-evenly;
  padding-block: 10px;
  flex-basis: 0;
}
</style>
