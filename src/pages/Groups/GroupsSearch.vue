<script lang="ts" setup>
import { ref, watch } from "vue";
import { icons, styledIcons } from "@/shared/constants/consts";
import { UseGroupSearch } from "@/pages/Groups/useGroupSearch";
import AButton from "@/components/AButton/AButton.vue";
import { GroupsSortEnum, OnlyAccessEnum, useGroups } from "@/store/groups/groups";
import GroupsTabs from "@/pages/Groups/GroupsTabs.vue";
import { useApp } from "@/store/app/app";
import { useDialog } from "@/store/dialog/dialog";

const props = defineProps<{
  groupSearch: UseGroupSearch;
}>();

const { showFilters } = props.groupSearch;
const groupsStore = useGroups();
const dialogService = useDialog();
const reference = ref(null);

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
  {
    title: "Открытые",
    value: OnlyAccessEnum.open,
  },
  {
    title: "Закрытые",
    value: OnlyAccessEnum.close,
  },
];

const sortEnumOptions = [
  {
    title: "Недавно добавленные",
    value: GroupsSortEnum.date,
  },
  {
    title: "В случайном порядке",
    value: GroupsSortEnum.random,
  },
  {
    title: "Количество изображений",
    value: GroupsSortEnum.photos,
  },
  {
    title: "Количество альбомов",
    value: GroupsSortEnum.albums,
  },
  {
    title: "Количество статей",
    value: GroupsSortEnum.articles,
  },
  {
    title: "Количество видео",
    value: GroupsSortEnum.videos,
  },
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
        title: "Подтверждение загрузки счётчиков",
        subtitle:
          "Вы применили сортировку по счётчикам. " +
          "\nОна будет работать только после загрузки счётчиков от всех групп текущей папки. " +
          "\nХотите запустить загрузку? " +
          "\nПри отмене сортировка будет сброшена.",
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
          :disabled="!groupsStore.filters.search.length"
          class="a-button__opacity"
          @mousedown.stop
          @click.stop="groupsStore.filters.search = ''"
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
          <VCardItem>
            <VCardTitle>Фильтры</VCardTitle>
          </VCardItem>
          <VCardItem>
            <VSelect
              v-model.number="groupsStore.filters.access"
              :items="accessEnumOptions"
              label="Фильтрация"
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
                label="Сортировка"
                style="flex-grow: 30"
              />
              <VSwitch
                v-model="groupsStore.filters.sortDesc"
                :false-icon="styledIcons.Icon24SortOutlineOpacity50"
                :true-icon="icons.Icon24SortOutline"
                label="В обратном порядке"
              />
              <VBtn
                v-if="groupsStore.filters.sort === GroupsSortEnum.random"
                style="margin-bottom: 22px"
                @click="groupsStore.updateRandomIndex()"
              >
                Пересортировать
              </VBtn>
            </div>
          </VCardItem>
          <VCardActions>
            <VSpacer />
            <VBtn @click="showFilters = false">Закрыть</VBtn>
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
