<script lang="ts" setup>
import { useGroupSearch } from "@/pages/AGroups/useGroupSearch";
import { useAppCaption } from "@/composables/useAppCaption";
import AGroupsSearch from "@/pages/AGroups/AGroupsSearch.vue";
import AGroupLink from "@/pages/AGroups/AGroupLink.vue";
import { DynamicScroller, DynamicScrollerItem } from "vue-virtual-scroller";
import { onActivated } from "vue";
import { useGroups } from "@/store/groups/groups";

useAppCaption("Группы");

const groupSearch = useGroupSearch();
const { groupsOrder, showFilters } = groupSearch;
const groupsStore = useGroups();

onActivated(async () => {
  await groupsStore.loadNotLoadGroups();
});
</script>

<template>
  <div
    class="a-groups vkuiGroup__inner Group__inner"
    @mousedown="showFilters = false"
    @touchstart="showFilters = false"
    @wheel="showFilters = false"
  >
    <AGroupsSearch :group-search="groupSearch" />
    <DynamicScroller
      :items="groupsOrder"
      :min-item-size="64"
      class="a-groups__groups"
      key-field="id"
      v-on="groupSearch.swipes"
    >
      <template v-slot="{ item, index, active }">
        <DynamicScrollerItem
          :active="active"
          :data-index="index"
          :item="item"
          :size-dependencies="[item.counters]"
        >
          <AGroupLink :group="item" :index="index" />
          <VDivider v-if="groupsOrder.length - 1 > index" />
        </DynamicScrollerItem>
      </template>
    </DynamicScroller>
  </div>
</template>

<style lang="scss">
.a-groups {
  background: var(--vkui--color_background_content);
  color: var(--vkui--color_text_primary);
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 5px;
  overflow: auto;
}

.a-groups__groups {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 5px;
  overflow: auto;
}

.a-groups__header {
  border-bottom: 1px solid currentColor;
  display: block;
  padding: 8px var(--vkui--size_base_padding_horizontal--regular);
}
</style>
