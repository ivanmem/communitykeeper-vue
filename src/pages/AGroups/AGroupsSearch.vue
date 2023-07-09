<script lang="ts" setup>
import { ref, h } from "vue";
import { autoUpdate, useFloating } from "@floating-ui/vue";
import { icons } from "@/common/consts";
import { UseGroupSearch } from "@/pages/AGroups/useGroupSearch";
import AButton from "@/components/AButton/AButton.vue";
import {
  GroupsSortEnum,
  OnlyAccessEnum,
  useGroups,
} from "@/store/groups/groups";
import { useApp } from "@/store/app/app";
import { showContextMenu } from "@/helpers/showContextMenu";

const props = defineProps<{
  groupSearch: UseGroupSearch;
}>();

const groupsStore = useGroups();
const { showFilters, store } = props.groupSearch;
const reference = ref(null);
const floating = ref(null);
const { x, y, strategy } = useFloating(reference, floating, {
  placement: "bottom-end",
  middleware: [],
  whileElementsMounted: autoUpdate,
  open: showFilters,
});

const { Icon24Filter, Icon16CrossCircleSmall } = icons;

const accessEnumOptions = [
  {
    title: "Все",
    value: OnlyAccessEnum.none,
  },
  {
    title: "Доступные",
    value: OnlyAccessEnum.access,
  },
  {
    title: "Недоступные",
    value: OnlyAccessEnum.noAccess,
  },
];

const sortEnumOptions = [
  {
    title: "Сначала новые",
    value: GroupsSortEnum.newest,
  },
  {
    title: "Сначала старые",
    value: GroupsSortEnum.oldest,
  },
  {
    title: "Случайный порядок",
    value: GroupsSortEnum.random,
  },
];

const onTabContextMenu = (e: MouseEvent, folder: string) => {
  if (!folder?.length) {
    return;
  }

  showContextMenu(e, [
    {
      label: "Удалить",
      icon: h(icons.Icon16DeleteOutline),
      onClick: () => {
        const folderGroupsIds = groupsStore.groupIdsDictByFolderName[folder];
        if (
          !confirm(
            `Вы уверены что хотите удалить папку "${folder}" с ${folderGroupsIds.length} группами?`
          )
        ) {
          return;
        }

        groupsStore.removeLocalGroup(new Set(folderGroupsIds));
        useGroups().autoSaveCurrentLocalGroups();
      },
    },
  ]);
};
</script>

<template>
  <div class="TopSearch">
    <VTabs
      v-model="store.filters.folder"
      style="margin-bottom: 5px"
      center-active
      density="compact"
      grow
      mandatory
      :show-arrows="useApp().isVkCom"
    >
      <VTab value="">Все</VTab>
      <VTab
        v-for="folder of store.folders"
        :key="folder"
        :value="folder"
        @contextmenu.prevent="onTabContextMenu($event, folder)"
      >
        {{ folder }}
      </VTab>
    </VTabs>
    <div style="display: flex; gap: 5px; flex-grow: 1">
      <input
        ref="reference"
        v-model="store.filters.search"
        class="TopSearch__input"
        placeholder="Поиск"
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
        <AButton
          :disabled="!store.filters.search.length"
          class="a-button__opacity"
          @mousedown.stop
          @click.stop="store.filters.search = ''"
        >
          <Icon16CrossCircleSmall />
        </AButton>
        <AButton
          class="a-button__opacity"
          @mousedown.stop
          @click.stop="showFilters = !showFilters"
        >
          <Icon24Filter />
        </AButton>
      </div>
      <VDialog v-model="showFilters">
        <VCard class="overflow-block a-group-filters">
          <VCardTitle>Фильтры</VCardTitle>
          <VCardItem>
            <VSelect
              v-model.number="store.filters.access"
              :items="accessEnumOptions"
              label="Фильтрация"
            />
            <VSelect
              v-model.number="store.filters.sort"
              :items="sortEnumOptions"
              label="Сортировка"
            />
          </VCardItem>
          <VCardActions>
            <VBtn @click="showFilters = false">Закрыть</VBtn>
            <VBtn
              @click="
                showFilters = false;
                store.filters = { ...store.filters };
              "
              >Обновить
            </VBtn>
          </VCardActions>
        </VCard>
      </VDialog>
    </div>
    <div
      aria-hidden="true"
      class="vkuiSearch__separator Search__separator vkuiSeparator Separator vkuiSeparator--wide Separator--wide"
      role="separator"
    >
      <div class="vkuiSeparator__in Separator__in"></div>
    </div>
  </div>
</template>
<style lang="scss">
.a-group-filters {
  display: flex;
  flex-direction: column;
  gap: 10px;

  section {
    display: flex;
    justify-content: right;
    align-items: center;
    gap: 10px;

    select {
      width: 145px;
    }

    h5 {
      display: flex;
      min-width: 90px;
      height: min-content;
    }
  }
}
</style>
