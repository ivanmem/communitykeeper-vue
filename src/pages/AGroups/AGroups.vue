<script lang="ts" setup>
import { useGroupSearch } from "@/pages/AGroups/useGroupSearch";
import { useAppCaption } from "@/composables/useAppCaption";
import AGroupsSearch from "@/pages/AGroups/AGroupsSearch.vue";
import AGroupLink from "@/pages/AGroups/AGroupLink.vue";
import { DynamicScroller, DynamicScrollerItem } from "vue-virtual-scroller";
import { onActivated } from "vue";
import { useGroups } from "@/store/groups/groups";
import { icons } from "@/common/consts";
import FixedTeleport from "@/components/FixedTeleport.vue";
import { useDialog } from "@/store/dialog/dialog";

useAppCaption("Группы");

const groupSearch = useGroupSearch();
const { groupsOrder, showFilters } = groupSearch;
const groupsStore = useGroups();
const dialogStore = useDialog();

const onHelp = () => {
  dialogStore.alert({
    title: "💡 Справка",
    subtitle: `Во вкладке "Группы" Вы можете:
- отсортировать и отфильтровать группы;
- заменить папку у группы;
- выйти или войти в группу;
- удалить группу;
- перейти в группу кликом по её названию;
- отобразить или скрыть счётчики кликом по аватарке группы;
- перейти в конкретный счётчик кликом по нему;
- открыть группу во встроенной галерее;
- переименовать или удалить папку нажатием правой кнопки мыши или удерживанием пальца на экране;
- найти группу через поиск по названию или статусу (то, что написано мелким шрифтом под названием группы).`,
  });
};

onActivated(async () => {
  await groupsStore.loadNotLoadGroups();
});
</script>

<template>
  <FixedTeleport to="#navigation-header__right">
    <VBtn :icon="icons.Icon16InfoCircle" variant="text" @click="onHelp" />
  </FixedTeleport>
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
