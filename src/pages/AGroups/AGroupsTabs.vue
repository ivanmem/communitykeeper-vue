<script lang="ts" setup>
import { useApp } from "@/store/app/app";
import { useGroups } from "@/store/groups/groups";
import { showContextMenu } from "@/helpers/showContextMenu";
import { h, ref } from "vue";
import { icons } from "@/common/consts";

const appStore = useApp();
const groupsStore = useGroups();

const renameDialog = ref<
  { folder: string; newSettings: { folder: string } } | undefined
>(undefined);

const onTabContextMenu = (e: MouseEvent, folder: string) => {
  if (!folder?.length) {
    return;
  }

  showContextMenu(e, [
    {
      label: "Настройки",
      icon: h(icons.Icon16Pen),
      onClick: () => {
        renameDialog.value = { folder, newSettings: { folder } };
      },
    },
    {
      label: "Удалить",
      icon: h(icons.Icon16DeleteOutline, { style: { color: "red" } }),
      onClick: () => {
        const folderGroupsIds = groupsStore.groupIdsDictByFolderName[folder];
        if (
          !confirm(
            `Вы уверены что хотите удалить папку "${folder}" с ${folderGroupsIds.length} группами?`
          )
        ) {
          return;
        }

        groupsStore.removeLocalGroup(new Set(folderGroupsIds));
        useGroups().autoSaveCurrentLocalGroups();
      },
    },
  ]);
};

const onSaveSettings = () => {
  if (!renameDialog.value) {
    return;
  }

  const newSettings = renameDialog.value.newSettings;
  let findChanges = false;
  if (renameDialog.value.folder !== newSettings.folder) {
    if (groupsStore.folders.includes(renameDialog.value.newSettings.folder)) {
      if (
        !window.confirm(
          `Папка с таким названием уже существует. Хотите произвести слияние?`
        )
      ) {
        return;
      }
    }

    const currentGroupsIds =
      groupsStore.groupIdsDictByFolderName[renameDialog.value.folder];
    currentGroupsIds.forEach((groupId) => {
      groupsStore.addLocalGroup({
        id: groupId,
        folder: newSettings.folder,
      });
      findChanges = true;
    });

    if (groupsStore.filters.folder === renameDialog.value.folder) {
      groupsStore.filters.folder = newSettings.folder;
    }
  }

  if (findChanges) {
    groupsStore.autoSaveCurrentLocalGroups();
  }

  renameDialog.value = undefined;
};
</script>
<template>
  <VTabs
    v-model="groupsStore.filters.folder"
    :show-arrows="appStore.isVkCom"
    center-active
    density="compact"
    grow
    mandatory
    style="margin-bottom: 5px"
  >
    <VTab value="">Все</VTab>
    <VTab
      v-for="folder of groupsStore.folders"
      :key="folder"
      :value="folder"
      @contextmenu.prevent="onTabContextMenu($event, folder)"
    >
      {{ folder }}
    </VTab>
  </VTabs>

  <VDialog
    :model-value="renameDialog !== undefined"
    @update:model-value="renameDialog = undefined"
  >
    <VCard v-if="renameDialog" class="overflow-block a-group-filters">
      <VCardTitle>Настройки папки "{{ renameDialog.folder }}"</VCardTitle>
      <VCardItem>
        <VTextField
          v-model="renameDialog.newSettings.folder"
          label="Название"
        />
        <VCardActions>
          <VBtn @click="renameDialog = undefined">Закрыть</VBtn>
          <VBtn @click="onSaveSettings">Сохранить</VBtn>
        </VCardActions>
      </VCardItem>
    </VCard>
  </VDialog>
</template>
