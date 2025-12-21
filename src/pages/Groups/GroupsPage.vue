<script lang="ts" setup>
import { useGroupSearch } from "@/pages/Groups/useGroupSearch";
import GroupsSearch from "@/pages/Groups/GroupsSearch.vue";
import GroupLink from "@/pages/Groups/GroupLink.vue";
import FixedTeleport from "@/components/FixedTeleport";
import { useDialog } from "@/store/dialog/dialog";
import BaseButton from "@/components/BaseButton";
import { useGroups } from "@/store/groups/groups";
import { VList } from "virtua/vue";
import {
  Icon24ErrorCircleOutline,
  Icon24InfoCircleOutline,
} from "vue-vkontakte-icons";
import { useI18n } from "vue-i18n";

const { t } = useI18n({
  messages: {
    ru: {
      noItems: "Элементы отсутствуют",
      add: "Добавить",
      helpTitle: "💡 Справка",
      helpText: `Во вкладке "Группы" Вы можете:
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
    },
    en: {
      noItems: "No items",
      add: "Add",
      helpTitle: "💡 Help",
      helpText: `In the "Groups" tab you can:
- sort and filter groups;
- change group folder;
- leave or join a group;
- delete a group;
- go to a group by clicking on its name;
- show or hide counters by clicking on the group avatar;
- go to a specific counter by clicking on it;
- open a group in the built-in gallery;
- rename or delete a folder by right-clicking or long-pressing;
- find a group by searching by name or status (the small text under the group name).`,
    },
  },
});

const groupSearch = useGroupSearch();
const { groupsRef, groupsOrder, showFilters } = groupSearch;
const dialogStore = useDialog();
const groupsStore = useGroups();

const onHelp = () => {
  dialogStore.alert({
    title: t("helpTitle"),
    subtitle: t("helpText"),
  });
};
</script>

<template>
  <FixedTeleport to="#navigation-header__right">
    <VBtn :icon="Icon24InfoCircleOutline" variant="text" @click="onHelp" />
  </FixedTeleport>
  <div
    class="a-groups"
    @mousedown="showFilters = false"
    @touchstart="showFilters = false"
    @wheel="showFilters = false"
  >
    <GroupsSearch :group-search="groupSearch" />
    <div v-if="!groupsOrder.length">
      <VBanner
        :icon="Icon24ErrorCircleOutline"
        color="deep-purple-accent-4"
        lines="one"
        style="padding-block: 8px"
      >
        <VBannerText>{{ t("noItems") }}</VBannerText>
        <div
          style="
            display: flex;
            align-items: center;
            flex-grow: 1;
            justify-content: flex-end;
          "
        >
          <BaseButton :to="{ name: 'add' }">{{ t("add") }}</BaseButton>
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
