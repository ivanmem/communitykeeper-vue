<script lang="ts" setup>
import { ref, watch } from "vue";
import { styledIcons } from "@/shared/constants/consts";
import { UseGroupSearch } from "@/pages/Groups/useGroupSearch";
import BaseButton from "@/components/BaseButton";
import {
  GroupsSortEnum,
  OnlyAccessEnum,
  useGroups,
} from "@/store/groups/groups";
import GroupsTabs from "@/pages/Groups/GroupsTabs.vue";
import { useApp } from "@/store/app/app";
import { useDialog } from "@/store/dialog/dialog";
import {
  Icon24SortOutline,
  Icon24Filter,
  Icon16CrossCircleSmall,
} from "vue-vkontakte-icons";
import ASeparator from "@/components/ASeparator";
import { useI18n } from "vue-i18n";

const { t } = useI18n({
  messages: {
    ru: {
      search: "Поиск",
      filters: "Фильтры",
      filter: "Фильтрация",
      sort: "Сортировка",
      reverseOrder: "В обратном порядке",
      reshuffle: "Пересортировать",
      close: "Закрыть",
      all: "Все",
      accessible: "Доступные",
      inaccessible: "Недоступные",
      open: "Открытые",
      closed: "Закрытые",
      recentlyAdded: "Недавно добавленные",
      randomOrder: "В случайном порядке",
      photoCount: "Количество изображений",
      albumCount: "Количество альбомов",
      articleCount: "Количество статей",
      videoCount: "Количество видео",
      loadCountersTitle: "Подтверждение загрузки счётчиков",
      loadCountersText: "Вы применили сортировку по счётчикам. \nОна будет работать только после загрузки счётчиков от всех групп текущей папки. \nХотите запустить загрузку? \nПри отмене сортировка будет сброшена.",
    },
    en: {
      search: "Search",
      filters: "Filters",
      filter: "Filter",
      sort: "Sort",
      reverseOrder: "Reverse order",
      reshuffle: "Reshuffle",
      close: "Close",
      all: "All",
      accessible: "Accessible",
      inaccessible: "Inaccessible",
      open: "Open",
      closed: "Closed",
      recentlyAdded: "Recently added",
      randomOrder: "Random order",
      photoCount: "Photo count",
      albumCount: "Album count",
      articleCount: "Article count",
      videoCount: "Video count",
      loadCountersTitle: "Confirm counters loading",
      loadCountersText: "You applied sorting by counters. \nIt will only work after loading counters from all groups in the current folder. \nDo you want to start loading? \nIf cancelled, sorting will be reset.",
    },
  },
});

const props = defineProps<{
  groupSearch: UseGroupSearch;
}>();

const { showFilters } = props.groupSearch;
const groupsStore = useGroups();
const dialogService = useDialog();
const reference = ref(null);

const accessEnumOptions = [
  { title: t("all"), value: OnlyAccessEnum.none },
  { title: t("accessible"), value: OnlyAccessEnum.access },
  { title: t("inaccessible"), value: OnlyAccessEnum.noAccess },
  { title: t("open"), value: OnlyAccessEnum.open },
  { title: t("closed"), value: OnlyAccessEnum.close },
];

const sortEnumOptions = [
  { title: t("recentlyAdded"), value: GroupsSortEnum.date },
  { title: t("randomOrder"), value: GroupsSortEnum.random },
  { title: t("photoCount"), value: GroupsSortEnum.photos },
  { title: t("albumCount"), value: GroupsSortEnum.albums },
  { title: t("articleCount"), value: GroupsSortEnum.articles },
  { title: t("videoCount"), value: GroupsSortEnum.videos },
];

const onLoadFolderCounters = useApp().wrapLoading(async () => {
  for (const groupId of groupsStore.groupIdsByCurrentFolderName) {
    await groupsStore.loadGroupCounters(groupsStore.groupsMap.get(groupId)!);
  }
});

// Загружаем все счётчики, если текущая сортировка связана с ними
watch(
  [() => groupsStore.isGroupCountersSort, () => groupsStore.filters.folder],
  async () => {
    if (
      !groupsStore.isGroupCountersSort ||
      groupsStore.isGroupCountersCurrentFolderLoaded
    ) {
      return;
    }

    if (
      !(await dialogService.confirm({
        title: t("loadCountersTitle"),
        subtitle: t("loadCountersText"),
      }))
    ) {
      groupsStore.filters.sort = GroupsSortEnum.date;
      return;
    }

    return onLoadFolderCounters();
  },
  { immediate: true },
);
</script>

<template>
  <div class="TopSearch">
    <GroupsTabs style="margin-bottom: 5px" />
    <div style="display: flex; gap: 5px; flex-grow: 1">
      <input
        ref="reference"
        v-model="groupsStore.filters.search"
        class="TopSearch__input"
        maxlength="50"
        :placeholder="t('search')"
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
          :disabled="!groupsStore.filters.search.length"
          class="a-button__opacity"
          @mousedown.stop
          @click.stop="groupsStore.filters.search = ''"
        >
          <Icon16CrossCircleSmall />
        </BaseButton>
        <BaseButton
          class="a-button__opacity"
          @mousedown.stop
          @click.stop="showFilters = !showFilters"
        >
          <Icon24Filter />
        </BaseButton>
      </div>
      <VDialog v-model="showFilters">
        <VCard class="overflow-block a-group-filters">
          <VCardItem>
            <VCardTitle>{{ t("filters") }}</VCardTitle>
          </VCardItem>
          <VCardItem>
            <VSelect
              v-model.number="groupsStore.filters.access"
              :items="accessEnumOptions"
              :label="t('filter')"
            />
            <div
              style="
                display: flex;
                column-gap: 20px;
                flex-wrap: wrap;
                align-items: center;
              "
            >
              <VSelect
                v-model.number="groupsStore.filters.sort"
                :items="sortEnumOptions"
                :label="t('sort')"
                style="flex-grow: 30"
              />
              <VSwitch
                v-model="groupsStore.filters.sortDesc"
                :false-icon="styledIcons.Icon24SortOutlineOpacity50"
                :true-icon="Icon24SortOutline"
                :label="t('reverseOrder')"
              />
              <VBtn
                v-if="groupsStore.filters.sort === GroupsSortEnum.random"
                style="margin-bottom: 22px"
                @click="groupsStore.updateRandomIndex()"
              >
                {{ t("reshuffle") }}
              </VBtn>
            </div>
          </VCardItem>
          <VCardActions>
            <VSpacer />
            <VBtn @click="showFilters = false">{{ t("close") }}</VBtn>
          </VCardActions>
        </VCard>
      </VDialog>
    </div>
    <ASeparator />
  </div>
</template>
<style lang="scss">
.a-group-filters {
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
