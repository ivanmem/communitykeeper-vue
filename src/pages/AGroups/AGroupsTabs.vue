<script lang="ts" setup>
import { useApp } from "@/store/app/app";
import { useGroups } from "@/store/groups/groups";
import { showContextMenu } from "@/helpers/showContextMenu";
import { h, PropType, ref, StyleValue } from "vue";
import { icons } from "@/common/consts";
import { useDialog } from "@/store/dialog/dialog";
import { folderRules, maxFolderLength } from "@/common/formConsts";

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
      onClick: async () => {
        const folderGroupsIds = groupsStore.groupIdsDictByFolderName[folder];
        const isConfirm = await dialogStore.confirm(
          `Вы уверены что хотите удалить папку "${folder}" с ${folderGroupsIds.length} группами?`,
        );
        if (!isConfirm) {
          return;
        }

        groupsStore.removeLocalGroup(new Set(folderGroupsIds));
        await groupsStore.autoSaveCurrentLocalGroups();
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

  renameDialog.value = undefined;
  if (findChanges) {
    await groupsStore.autoSaveCurrentLocalGroups();
  }
};

const valid = ref(false);
const { Icon16FolderOutline } = icons;
</script>
<template>
  <div v-show="groupsStore.folders.length > 0" :style="style">
    <VTabs
      v-model="groupsStore.filters.folder"
      :show-arrows="true"
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
    <VForm v-if="renameDialog" v-model="valid">
      <VCard class="overflow-block a-group-filters">
        <VCardItem>
          <VCardTitle>Настройки папки</VCardTitle>
          <div
            style="
              display: flex;
              justify-content: flex-start;
              align-items: center;
              gap: 5px;
              padding-bottom: 10px;
              margin-top: 4px;
            "
          >
            <Icon16FolderOutline style="flex-shrink: 0" />
            <div style="word-break: break-word">
              {{ renameDialog.folder }}
            </div>
          </div>
          <VTextField
            v-model.trim="renameDialog.newSettings.folder"
            :counter="maxFolderLength"
            :rules="folderRules"
            label="Название"
            required
          />
        </VCardItem>
        <VCardActions>
          <VSpacer />
          <VBtn @click="renameDialog = undefined">Закрыть</VBtn>
          <VBtn
            :disabled="!valid || !renameDialog.newSettings.folder"
            @click="onSaveSettings"
          >
            Сохранить
          </VBtn>
        </VCardActions>
      </VCard>
    </VForm>
  </VDialog>
</template>
