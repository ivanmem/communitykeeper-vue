<script lang="ts" setup>
import { useGroupSearch } from "@/pages/Groups/useGroupSearch";
import GroupsSearch from "@/pages/Groups/GroupsSearch.vue";
import GroupLink from "@/pages/Groups/GroupLink.vue";
import { icons } from "@/shared/constants/consts";
import FixedTeleport from "@/components/FixedTeleport";
import { useDialog } from "@/store/dialog/dialog";
import BaseButton from "@/components/BaseButton";
import { useGroups } from "@/store/groups/groups";
// @ts-ignore
import { VList } from "virtua/vue";

const groupSearch = useGroupSearch();
const { groupsRef, groupsOrder, showFilters } = groupSearch;
const dialogStore = useDialog();
const groupsStore = useGroups();

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
</script>

<template>
  <FixedTeleport to="#navigation-header__right">
    <VBtn
      :icon="icons.Icon24InfoCircleOutline"
      variant="text"
      @click="onHelp"
    />
  </FixedTeleport>
  <div
    class="a-groups vkuiGroup__inner Group__inner"
    @mousedown="showFilters = false"
    @touchstart="showFilters = false"
    @wheel="showFilters = false"
  >
    <GroupsSearch :group-search="groupSearch" />
    <div v-if="!groupsOrder.length">
      <VBanner
        :icon="icons.Icon24ErrorCircleOutline"
        color="deep-purple-accent-4"
        lines="one"
        style="padding-block: 8px"
      >
        <VBannerText>Элементы отсутствуют</VBannerText>
        <div
          style="
            display: flex;
            align-items: center;
            flex-grow: 1;
            justify-content: flex-end;
          "
        >
          <BaseButton to="/add/">Добавить</BaseButton>
        </div>
      </VBanner>
    </div>
    <template v-else>
      <VList
        :key="groupsStore.filters.folder"
        ref="groupsRef"
        #default="{ item, index }"
        :data="groupsOrder"
        class="a-groups__groups"
        v-on="groupSearch.swipes"
      >
        <div v-if="item" :key="item?.id ?? index">
          <GroupLink :group="item" apply-filters />
          <VDivider v-if="groupsOrder.length - 1 !== index" />
        </div>
      </VList>
    </template>
  </div>
</template>

<style lang="scss">
.a-groups {
  background: var(--vkui--color_background_content);
  color: var(--vkui--color_text_primary);
  display: flex;
  flex-direction: column;
  flex-grow: 1;
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
