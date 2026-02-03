<script lang="ts" setup>
import { computed, ref } from "vue";
import { styledIcons } from "@/shared/constants/consts";
import BaseButton from "@/components/BaseButton";
import {
  AlbumsSortEnum,
  type AlbumsFilters,
} from "@/pages/Albums/useAlbumsFilters";
import {
  Icon24SortOutline,
  Icon24Filter,
  Icon16CrossCircleSmall,
} from "vue-vkontakte-icons";
import ASeparator from "@/components/ASeparator";
import { t } from "@/i18n";

const props = defineProps<{
  filters: AlbumsFilters;
}>();

const showFilters = defineModel<boolean>("showFilters", { default: false });
const inputRef = ref<HTMLInputElement | null>(null);

const sortEnumOptions = computed(() => [
  { title: t("sorters.albums.date"), value: AlbumsSortEnum.date },
  { title: t("sorters.albums.size"), value: AlbumsSortEnum.size },
  { title: t("sorters.albums.created"), value: AlbumsSortEnum.created },
  { title: t("sorters.albums.updated"), value: AlbumsSortEnum.updated },
]);

function onClearSearch(): void {
  props.filters.search = "";
  inputRef.value?.focus();
}

function onToggleFilters(): void {
  showFilters.value = !showFilters.value;
}

function onCloseFilters(): void {
  showFilters.value = false;
}
</script>

<template>
  <div class="TopSearch">
    <div style="display: flex; gap: 5px; flex-grow: 1">
      <input
        ref="inputRef"
        v-model="filters.search"
        class="TopSearch__input"
        maxlength="100"
        :placeholder="t('albumsSearch.searchPlaceholder')"
      />
      <div
        style="
          display: flex;
          gap: 5px;
          flex-grow: 1;
          padding: 5px;
          margin-right: 10px;
        "
      >
        <BaseButton
          :disabled="!filters.search.length"
          class="a-button__opacity"
          @mousedown.stop
          @click.stop="onClearSearch"
        >
          <Icon16CrossCircleSmall />
        </BaseButton>
        <BaseButton
          class="a-button__opacity"
          @mousedown.stop
          @click.stop="onToggleFilters"
        >
          <Icon24Filter />
        </BaseButton>
      </div>
      <VDialog v-model="showFilters">
        <VCard class="overflow-block a-albums-filters">
          <VCardItem>
            <VCardTitle>{{ t("common.filters") }}</VCardTitle>
          </VCardItem>
          <VCardItem>
            <div
              style="
                display: flex;
                column-gap: 20px;
                flex-wrap: wrap;
                align-items: center;
              "
            >
              <VSelect
                v-model="filters.sort"
                :items="sortEnumOptions"
                :label="t('common.sort')"
                style="flex-grow: 30"
              />
              <VSwitch
                v-model="filters.sortDesc"
                :disabled="filters.sort === AlbumsSortEnum.date"
                :false-icon="styledIcons.Icon24SortOutlineOpacity50"
                :true-icon="Icon24SortOutline"
                :label="t('common.reverseOrder')"
              />
            </div>
          </VCardItem>
          <VCardActions>
            <VSpacer />
            <VBtn @click="onCloseFilters">{{ t("common.close") }}</VBtn>
          </VCardActions>
        </VCard>
      </VDialog>
    </div>
    <ASeparator />
  </div>
</template>

<style lang="scss">
.a-albums-filters {
  display: flex;
  flex-direction: column;
  gap: 10px;

  section {
    align-items: center;
    display: flex;
    gap: 10px;
    justify-content: right;

    select {
      width: 145px;
    }

    h5 {
      display: flex;
      height: min-content;
      min-width: 90px;
    }
  }

  .v-card-item__content {
    overflow: visible;
  }
}
</style>
