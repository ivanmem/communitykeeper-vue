<script lang="ts" setup>
import { ref } from "vue";
import { autoUpdate, useFloating } from "@floating-ui/vue";
import { icons } from "@/common/consts";
import { UseGroupSearch } from "@/pages/AGroups/useGroupSearch";
import AButton from "@/components/AButton/AButton.vue";
import { GroupsSortEnum, OnlyAccessEnum, useGroups } from "@/store/groups/groups";
import AGroupsTabs from "@/pages/AGroups/AGroupsTabs.vue";

const props = defineProps<{
  groupSearch: UseGroupSearch;
}>();

const { showFilters } = props.groupSearch;
const groupsStore = useGroups();

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
</script>

<template>
  <div class="TopSearch">
    <AGroupsTabs style="margin-bottom: 5px; padding-inline: 10px" />
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
          <VCardTitle>Фильтры</VCardTitle>
          <VCardItem>
            <VSelect
              v-model.number="groupsStore.filters.access"
              :items="accessEnumOptions"
              label="Фильтрация"
            />
            <VSelect
              v-model.number="groupsStore.filters.sort"
              :items="sortEnumOptions"
              label="Сортировка"
            />
          </VCardItem>
          <VCardActions>
            <VBtn @click="showFilters = false">Закрыть</VBtn>
            <VBtn
              @click="
                showFilters = false;
                groupsStore.filters = { ...groupsStore.filters };
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
}
</style>
