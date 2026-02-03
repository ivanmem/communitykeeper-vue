<script lang="ts" setup>
import { reactive, watch } from "vue";
import { useAlbums } from "@/pages/Albums/useAlbums";
import {
  AlbumsSortEnum,
  useAlbumsFilters,
} from "@/pages/Albums/useAlbumsFilters";
import AlbumsBreadcrumbs from "./AlbumsBreadcrumbs.vue";
import AlbumsList from "./AlbumsList.vue";
import AlbumsSearch from "./AlbumsSearch.vue";
import ImagePreloader from "@/components/ImagePreloader";
import AError from "@/components/AError";
import { useDialog } from "@/store/dialog/dialog";
import { useI18n } from "vue-i18n";

const props = defineProps<{ ownerId: number | string }>();
const { t } = useI18n();
const dialogService = useDialog();

const filters = reactive({
  search: "",
  sort: AlbumsSortEnum.date,
  sortDesc: true,
});

const {
  isInit,
  group,
  albums,
  previewPreloader,
  onScrollerUpdate,
  componentRef,
  screenError,
  sizes,
  columns,
  isAllLoaded,
  loadAllAlbums,
} = useAlbums(() => props.ownerId);

const { showFilters, filteredAlbums, filteredIndexes, needsAllLoaded } = useAlbumsFilters({
  albums: () => albums.items,
  isAllLoaded,
  columns,
  filters,
});

// Загружаем все альбомы, если текущая сортировка требует этого
watch(
  [() => filters.sort, () => props.ownerId, isAllLoaded],
  onLoadNeedsConfirmation,
  { immediate: true },
);

async function onLoadNeedsConfirmation(): Promise<void> {
  if (!needsAllLoaded.value || isAllLoaded.value) {
    return;
  }

  const confirmed = await dialogService.confirm({
    title: t("albumsSearch.loadAlbumsTitle"),
    subtitle: t("albumsSearch.loadAlbumsText"),
  });

  if (!confirmed) {
    filters.sort = AlbumsSortEnum.date;
    return;
  }

  return loadAllAlbums();
}
</script>

<template>
  <div class="a-albums">
    <template v-if="isInit">
      <AlbumsBreadcrumbs :group-name="group?.name" :owner-id="ownerId" />
      <AlbumsSearch v-model:show-filters="showFilters" :filters="filters" />
      <div class="a-albums__details">
        <AError v-if="screenError">{{ screenError }}</AError>
      </div>
      <AlbumsList
        v-model:component-ref="componentRef"
        :albums="filteredAlbums"
        :indexes="filteredIndexes"
        :sizes="sizes"
        @scroll="onScrollerUpdate"
      />
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

  &__details {
    display: flex;
    flex-direction: column;
    align-items: flex-start;
    padding-inline: 16px;
  }
}
</style>
