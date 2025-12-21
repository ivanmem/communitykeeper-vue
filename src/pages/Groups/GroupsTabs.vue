<script lang="ts" setup>
import { useApp } from "@/store/app/app";
import { useGroups } from "@/store/groups/groups";
import { showContextMenu } from "@/shared/helpers/showContextMenu";
import { h, onDeactivated, PropType, ref, StyleValue } from "vue";
import { useDialog } from "@/store/dialog/dialog";
import { folderRules, maxFolderLength } from "@/shared/constants/formConsts";
import {
  Icon16Pen,
  Icon16FolderOutline,
  Icon16DeleteOutline,
} from "vue-vkontakte-icons";
import { useI18n } from "vue-i18n";

const { t } = useI18n({
  messages: {
    ru: {
      all: "Все",
      settings: "Настройки",
      delete: "Удалить",
      confirmDelete: 'Вы уверены что хотите удалить папку "{folder}" с {count} группами?',
      folderSettings: "Настройки папки",
      name: "Название",
      close: "Закрыть",
      save: "Сохранить",
      mergeTitle: "Подтверждение слияния папок",
      mergeConfirm: 'Папка с названием "{folder}" уже существует. Хотите произвести слияние?',
    },
    en: {
      all: "All",
      settings: "Settings",
      delete: "Delete",
      confirmDelete: 'Are you sure you want to delete folder "{folder}" with {count} groups?',
      folderSettings: "Folder settings",
      name: "Name",
      close: "Close",
      save: "Save",
      mergeTitle: "Confirm folder merge",
      mergeConfirm: 'Folder "{folder}" already exists. Do you want to merge?',
    },
  },
});

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
      label: t("settings"),
      icon: h(Icon16Pen),
      onClick: () => {
        renameDialog.value = { folder, newSettings: { folder } };
      },
    },
    {
      label: t("delete"),
      icon: h(Icon16DeleteOutline, { style: { color: "red" } }),
      onClick: async () => {
        const folderGroupsIds = groupsStore.groupIdsDictByFolderName[folder];
        const isConfirm = await dialogStore.confirm(
          t("confirmDelete", { folder, count: folderGroupsIds.length }),
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
    newSettings.folder = existsFolder;
  }

  if (renameDialog.value.folder !== newSettings.folder) {
    if (groupsStore.folders.includes(renameDialog.value.newSettings.folder)) {
      const confirm = await dialogStore.confirm({
        title: t("mergeTitle"),
        subtitle: t("mergeConfirm", { folder: newSettings.folder }),
      });
      if (!confirm) {
        return;
      }
    }

    const transferredGroupsIds =
      groupsStore.groupIdsDictByFolderName[renameDialog.value.folder];
    for (const groupId of transferredGroupsIds) {
      groupsStore.addLocalGroup({
        id: groupId,
        folder: newSettings.folder,
      });
      findChanges = true;
    }

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

onDeactivated(() => {
  renameDialog.value = undefined;
});
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
      <VTab value="">{{ t("all") }}</VTab>
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
    close-on-back
    @update:model-value="renameDialog = undefined"
  >
    <VForm v-if="renameDialog" v-model="valid">
      <VCard class="overflow-block a-group-filters">
        <VCardItem>
          <VCardTitle>{{ t("folderSettings") }}</VCardTitle>
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
            v-model.trim="renameDialog!.newSettings.folder"
            :counter="maxFolderLength"
            :rules="folderRules"
            :label="t('name')"
            required
          />
        </VCardItem>
        <VCardActions>
          <VSpacer />
          <VBtn @click="renameDialog = undefined">{{ t("close") }}</VBtn>
          <VBtn
            :disabled="!valid || !renameDialog!.newSettings.folder"
            @click="onSaveSettings"
          >
            {{ t("save") }}
          </VBtn>
        </VCardActions>
      </VCard>
    </VForm>
  </VDialog>
</template>
