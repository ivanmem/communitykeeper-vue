<script lang="ts" setup>
import { useGroupSearch } from "@/pages/AGroups/useGroupSearch";
import { useAppCaption } from "@/hooks/useAppCaption";
import AGroupsSearch from "@/pages/AGroups/AGroupsSearch.vue";
import AGroupLink from "@/pages/AGroups/AGroupLink.vue";
import { DynamicScroller, DynamicScrollerItem } from "vue-virtual-scroller";
import { onActivated } from "vue";

useAppCaption("Группы");

const groupSearch = useGroupSearch();
const { store, groupsOrder, showFilters } = groupSearch;

onActivated(async () => {
  await store.loadNotLoadGroups();
});
</script>

<template>
  <div
    class="a-groups vkuiGroup__inner Group__inner"
    @mousedown="showFilters = false"
    @wheel="showFilters = false"
    @touchstart="showFilters = false"
  >
    <AGroupsSearch :group-search="groupSearch" />
    <DynamicScroller
      class="a-groups__groups"
      :items="groupsOrder"
      :min-item-size="64"
      key-field="id"
    >
      <template v-slot="{ item, index, active }">
        <DynamicScrollerItem
          :item="item"
          :active="active"
          :size-dependencies="[item.counters]"
          :data-index="index"
        >
          <AGroupLink :key="item.id" :group="item" :index="index" />
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>
  </div>
</template>

<style lang="scss">
.a-groups {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: auto;
  gap: 5px;
  background: var(--vkui--color_background_content);
  color: var(--vkui--color_text_primary);
}

.a-groups__groups {
  display: flex;
  flex-grow: 1;
  overflow: auto;
  flex-direction: column;
  gap: 5px;
}

.a-groups__header {
  display: block;
  padding: 8px var(--vkui--size_base_padding_horizontal--regular);
  border-bottom: 1px solid currentColor;
}
</style>
