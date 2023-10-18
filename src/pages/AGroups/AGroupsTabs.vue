<script lang="ts" setup>
import { useApp } from "@/store/app/app";
import { useGroups } from "@/store/groups/groups";
import { showContextMenu } from "@/helpers/showContextMenu";
import { h, PropType, ref, StyleValue } from "vue";
import { icons } from "@/common/consts";
import { useDialog } from "@/store/dialog/dialog";

const props = defineProps({
  style: { type: [String, Object, Array] as PropType<StyleValue> },
});
const appStore = useApp();
const groupsStore = useGroups();
const dialogStore = useDialog();

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
            `Вы уверены что хотите удалить папку "${folder}" с ${folderGroupsIds.length} группами?`,
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

const onSaveSettings = async () => {
  if (!renameDialog.value) {
    return;
  }

  const newSettings = renameDialog.value.newSettings;
  let findChanges = false;
  const newSettingsFolderLowerCase = newSettings.folder.toLowerCase();
  const existsFolder = groupsStore.folders.find(
    (folder) => folder.toLowerCase() === newSettingsFolderLowerCase,
  );
  if (existsFolder) {
    // костыль для того, чтобы пользователь мог сделать слияние для существующей папки, даже если там отличается кейс
    newSettings.folder = existsFolder;
  }

  if (renameDialog.value.folder !== newSettings.folder) {
    if (groupsStore.folders.includes(renameDialog.value.newSettings.folder)) {
      const confirm = await dialogStore.confirm({
        title: "Подтверждение слияния папок",
        subtitle: `Папка с названием "${newSettings.folder}" уже существует. Хотите произвести слияние?`,
      });
      if (!confirm) {
        return;
      }
    }

    const transferredGroupsIds =
      groupsStore.groupIdsDictByFolderName[renameDialog.value.folder];
    transferredGroupsIds.forEach((groupId) => {
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
  <div :style="style">
    <VTabs
      v-model="groupsStore.filters.folder"
      :show-arrows="appStore.isVkCom"
      center-active
      density="compact"
      grow
      mandatory
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
  </div>

  <VDialog
    :model-value="renameDialog !== undefined"
    @update:model-value="renameDialog = undefined"
  >
    <VCard v-if="renameDialog" class="overflow-block a-group-filters">
      <VCardItem>
        <VCardTitle>Настройки папки "{{ renameDialog.folder }}"</VCardTitle>
      </VCardItem>
      <VCardItem>
        <VTextField
          v-model="renameDialog.newSettings.folder"
          label="Название"
        />
      </VCardItem>
      <VCardActions>
        <VSpacer />
        <VBtn @click="renameDialog = undefined">Закрыть</VBtn>
        <VBtn @click="onSaveSettings">Сохранить</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
