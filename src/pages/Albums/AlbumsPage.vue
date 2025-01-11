<script lang="ts" setup>
import { computed } from "vue";
import AlbumsPreview from "@/pages/Albums/AlbumsPreview.vue";
import { useAlbums } from "@/pages/Albums/useAlbums";
import { icons } from "@/shared/constants/consts";
import { openUrl } from "@/shared/helpers/openUrl";
import { PhotoHelper } from "@/shared/helpers/PhotoHelper";
// @ts-ignore
import { VList } from "virtua/vue";
import ImagePreloader from "@/components/ImagePreloader";

const { Icon16Link, Icon16ChevronOutline } = icons;
const props = defineProps<{ ownerId: number | string }>();
const {
  isInit,
  group,
  albums,
  previewPreloader,
  onScrollerUpdate,
  componentRef,
  screenError,
  sizes,
} = useAlbums(() => props.ownerId);
const ownerUrl = computed(() => PhotoHelper.getOwnerUrl(props.ownerId));
</script>

<template>
  <div class="a-albums vkuiGroup__inner Group__inner">
    <template v-if="isInit">
      <div
        style="
          display: flex;
          flex-direction: column;
          align-items: flex-start;
          padding-inline: 16px;
        "
      >
        <VBreadcrumbs density="compact">
          <VBreadcrumbsItem
            replace
            style="padding-left: 0"
            title="Группы"
            to="/"
          />
          <Icon16ChevronOutline />
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
        ref="componentRef"
        #default="{ item: indexes, index }"
        :data="albums.indexes"
        :item-size="sizes.height"
        class="a-albums__items"
        @scroll="onScrollerUpdate()"
      >
        <div
          :key="albums.items[indexes?.[0]]?.id ?? index"
          class="a-albums-row"
        >
          <AlbumsPreview
            v-for="index in indexes"
            :key="albums.items[index].id"
            :album="albums.items[index]"
            :sizes="sizes"
          />
        </div>
      </VList>
    </template>
    <ImagePreloader :photos="previewPreloader.photos.value" />
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
  flex-basis: 0;
  flex-grow: 1;
  padding-block: 10px;
}
</style>
