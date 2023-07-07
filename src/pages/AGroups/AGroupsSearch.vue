<script lang="ts" setup>
import { ref } from "vue";
import { autoUpdate, useFloating } from "@floating-ui/vue";
import { icons } from "@/common/consts";
import { UseGroupSearch } from "@/pages/AGroups/useGroupSearch";
import AButton from "@/components/AButton/AButton.vue";
import { GroupsSortEnum, OnlyAccessEnum } from "@/store/groups/groups";

const props = defineProps<{
  groupSearch: UseGroupSearch;
}>();

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
    label: "Все",
    value: OnlyAccessEnum.none,
  },
  {
    label: "Доступные",
    value: OnlyAccessEnum.access,
  },
  {
    label: "Недоступные",
    value: OnlyAccessEnum.noAccess,
  },
];

const sortEnumOptions = [
  {
    label: "Сначала новые",
    value: GroupsSortEnum.newest,
  },
  {
    label: "Сначала старые",
    value: GroupsSortEnum.oldest,
  },
  {
    label: "Случайный порядок",
    value: GroupsSortEnum.random,
  },
];
</script>

<template>
  <div class="TopSearch">
    <VTabs
      v-model="store.filters.folder"
      style="margin-bottom: 10px"
      center-active
      show-arrows
    >
      <VTab value="">Все</VTab>
      <VTab :key="folder" v-for="folder of store.folders" :value="folder">
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
      <div
        v-if="showFilters"
        ref="floating"
        class="a-popup a-group-filters"
        :style="{
          position: strategy,
          top: `${y ?? 0}px`,
          left: `${x ?? 0}px`,
        }"
        @mousedown.stop
        @touchstart.stop
        @click.stop
      >
        <section>
          <h5 class="vkuiFormItem__top vkuiSubhead vkuiSubhead--sizeY-none">
            Фильтрация
          </h5>
          <select v-model.number="store.filters.access" class="a-select">
            <option
              v-for="opt of accessEnumOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </section>
        <section>
          <h5 class="vkuiFormItem__top vkuiSubhead vkuiSubhead--sizeY-none">
            Сортировка
          </h5>
          <select v-model.number="store.filters.sort" class="a-select">
            <option
              v-for="opt of sortEnumOptions"
              :key="opt.value"
              :value="opt.value"
            >
              {{ opt.label }}
            </option>
          </select>
        </section>
        <section style="flex-direction: row">
          <AButton @click="showFilters = false">Закрыть</AButton>
          <AButton
            @click="
              showFilters = false;
              store.filters = { ...store.filters };
            "
            >Обновить
          </AButton>
        </section>
      </div>
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
