<script lang="ts" setup>
import { computed, ref, watch } from "vue";
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
import { t } from "@/i18n";

const props = defineProps<{
  groupSearch: UseGroupSearch;
}>();

const { showFilters } = props.groupSearch;
const groupsStore = useGroups();
const dialogService = useDialog();
const reference = ref(null);

const accessEnumOptions = computed(() => [
  { title: t("common.all"), value: OnlyAccessEnum.none },
  { title: t("groupsSearch.accessible"), value: OnlyAccessEnum.access },
  { title: t("groupsSearch.inaccessible"), value: OnlyAccessEnum.noAccess },
  { title: t("groupsSearch.open"), value: OnlyAccessEnum.open },
  { title: t("groupsSearch.closed"), value: OnlyAccessEnum.close },
]);

const sortEnumOptions = computed(() => [
  { title: t("sorters.groups.date"), value: GroupsSortEnum.date },
  { title: t("sorters.groups.random"), value: GroupsSortEnum.random },
  { title: t("sorters.groups.photos"), value: GroupsSortEnum.photos },
  { title: t("sorters.groups.albums"), value: GroupsSortEnum.albums },
  { title: t("sorters.groups.articles"), value: GroupsSortEnum.articles },
  { title: t("sorters.groups.videos"), value: GroupsSortEnum.videos },
]);

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
        title: t("groupsSearch.loadCountersTitle"),
        subtitle: t("groupsSearch.loadCountersText"),
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
        :placeholder="t('common.search')"
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
            <VCardTitle>{{ t("common.filters") }}</VCardTitle>
          </VCardItem>
          <VCardItem>
            <VSelect
              v-model.number="groupsStore.filters.access"
              :items="accessEnumOptions"
              :label="t('common.filter')"
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
                :label="t('common.sort')"
                style="flex-grow: 30"
              />
              <VSwitch
                v-model="groupsStore.filters.sortDesc"
                :false-icon="styledIcons.Icon24SortOutlineOpacity50"
                :true-icon="Icon24SortOutline"
                :label="t('common.reverseOrder')"
              />
              <VBtn
                v-if="groupsStore.filters.sort === GroupsSortEnum.random"
                style="margin-bottom: 22px"
                @click="groupsStore.updateRandomIndex()"
              >
                {{ t("groupsSearch.reshuffle") }}
              </VBtn>
            </div>
          </VCardItem>
          <VCardActions>
            <VSpacer />
            <VBtn @click="showFilters = false">{{ t("common.close") }}</VBtn>
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
