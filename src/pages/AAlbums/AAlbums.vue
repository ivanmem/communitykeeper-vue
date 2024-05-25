<script lang="ts" setup>
import { computed } from "vue";
import AAlbumsPreview from "@/pages/AAlbums/AAlbumsPreview.vue";
import { useAlbums } from "@/pages/AAlbums/useAlbums";
import { icons } from "@/common/consts";
import { openUrl } from "@/helpers/openUrl";
import { PhotoHelper } from "@/helpers/PhotoHelper";
// @ts-ignore
import { VList } from "virtua/vue";

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
  sizes,
} = useAlbums(() => props.ownerId);
const { Icon16Link } = icons;
const ownerUrl = computed(() => PhotoHelper.getOwnerUrl(props.ownerId));
</script>

<template>
  <div class="a-albums vkuiGroup__inner Group__inner">
    <template v-if="isInit">
      <div style="padding-inline: 16px">
        <VBreadcrumbs density="compact">
          <VBreadcrumbsItem
            replace
            style="padding-left: 0"
            title="Группы"
            to="/"
          />
          <VIcon icon="mdi-chevron-right" size="small" />
          <VBreadcrumbsItem
            :href="`https://${ownerUrl}`"
            :title="group?.name || 'Источник'"
            style="opacity: 0.7"
            @click.prevent="openUrl(`//${ownerUrl}`)"
          />
        </VBreadcrumbs>
        <code v-if="screenError" class="vkuiFormField--status-error">
          {{ screenError }}
        </code>
      </div>
      <VList
        ref="albumsRef"
        #default="indexes"
        :data="albums.indexes"
        class="a-albums__items"
        @range-change="onScrollerUpdate"
      >
        <div class="a-albums-row">
          <AAlbumsPreview
            v-for="index in indexes"
            :key="albums.items[index].id"
            :album="albums.items[index]"
            :sizes="sizes"
          />
        </div>
      </VList>
    </template>

    <div></div>
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
}

.a-albums-row {
  display: flex;
}

.a-albums__items {
  display: flex;
  flex-basis: 0;
  flex-direction: row;
  flex-grow: 1;
  flex-wrap: wrap;
  gap: 5px;
  justify-content: space-evenly;
  overflow-x: auto;
  overflow-y: scroll !important;
  padding-block: 10px;

  &::-webkit-scrollbar {
    width: 0px;
  }
}
</style>
