<script lang="ts" setup>
import { VK_SHORT_LINK } from "@/shared/constants/consts";
import { computed, ref, watch } from "vue";
import { useGroups } from "@/store/groups/groups";
import BaseToolbar from "@/components/BaseToolbar";
import { useDialog } from "@/store/dialog/dialog";
import { useApp } from "@/store/app/app";
import { isGroupsExport } from "@/store/groups/isGroupsExport";
import { IGroupsExport } from "@/store/groups/types";
import { useRoute, useRouter } from "vue-router";
import { useVk } from "@/store/vk/vk";
import { decodeAndDecompressObject } from "@/shared/helpers/decodeAndDecompress";
import {
  Icon24CancelOutline,
  Icon24MemoryCard,
  Icon24UploadOutline,
} from "vue-vkontakte-icons";
import { useI18n } from "vue-i18n";

const { t } = useI18n({
  messages: {
    ru: {
      load: "Загрузить",
      loadBackup: "Загрузка резервной копии",
      selectFolders: "Выберите нужные папки и нажмите на кнопку сохранения. Названия папок у уже существующих групп будут обновлены на новые.",
      newGroupsSelected: "Выбрано новых групп:",
      folderUpdatesSelected: "Выбрано обновлений названий папок:",
      all: "Все",
      groupsCount: "Групп: {count}",
      selected: "Выбрано",
      folders: "Папок",
      groups: "Групп",
      save: "Сохранить",
      error: "Ошибка",
      importError: "Ошибка импорта",
      importNotFound: "Данные для импорта не были найдены.\nКод ошибки: {error}",
      importCorrupted: "Данные для импорта были повреждены.\nКод ошибки: {error}",
      fileTooLarge: "Слишком большой размер файла. Резервная копия не может быть больше мегабайта.",
      wrongFormat: "Неверный формат файла. Резервная копия должна быть в формате .json.",
      fileCorrupted: "Выбранный файл повреждён.",
      invalidData: "Некорректные данные.",
      importComplete: "Импорт завершён",
      importResult: "Новых групп: {newGroups}.\nОбновлений названий папок: {folderUpdates}",
    },
    en: {
      load: "Load",
      loadBackup: "Load backup",
      selectFolders: "Select folders and click save button. Folder names for existing groups will be updated.",
      newGroupsSelected: "New groups selected:",
      folderUpdatesSelected: "Folder name updates selected:",
      all: "All",
      groupsCount: "Groups: {count}",
      selected: "Selected",
      folders: "Folders",
      groups: "Groups",
      save: "Save",
      error: "Error",
      importError: "Import error",
      importNotFound: "Import data not found.\nError code: {error}",
      importCorrupted: "Import data is corrupted.\nError code: {error}",
      fileTooLarge: "File is too large. Backup cannot be larger than 1 MB.",
      wrongFormat: "Wrong file format. Backup must be in .json format.",
      fileCorrupted: "Selected file is corrupted.",
      invalidData: "Invalid data.",
      importComplete: "Import complete",
      importResult: "New groups: {newGroups}.\nFolder name updates: {folderUpdates}",
    },
  },
});

const router = useRouter();
const route = useRoute();
const show = ref(false);
const onClose = () => (show.value = false);
const onShow = () => (show.value = true);
const groupsStore = useGroups();
const dialogStore = useDialog();
const appStore = useApp();
const vkStore = useVk();

// текущие выбранные папки
const folders = ref(new Set<string>());
// текущие данные для импорта
const importData = ref<IGroupsExport | undefined>();
// все существующие папки в данных для импорта
const importFolders = computed(() => {
  if (!importData.value) {
    return [];
  }

  return Object.keys(importData.value.groupIdsDictByFolderName);
});
// импортируемые сокращённые ссылки, содержащие сжатые данные для импорта
const importShortLinks = computed<string[]>(
  () =>
    (route.query.importHashes as string | undefined)
      ?.split(",")
      .map((hash) => `${VK_SHORT_LINK.shortPrefix}${hash}`) ?? [],
);
// общее количество групп в импортируемых данных
const importGroupsCount = computed(() =>
  Object.values(importData.value?.groupIdsDictByFolderName ?? {}).reduce(
    (sum, ids) => sum + ids.length,
    0,
  ),
);
// id всех выбранных групп
const selectedGroups = computed<number[]>(() => {
  if (!importData.value) {
    return [];
  }

  return [...folders.value].flatMap(
    (folder) => importData.value!.groupIdsDictByFolderName[folder],
  );
});
// количество новых выбранных групп
const selectedNewGroups = computed<number[]>(() => {
  return selectedGroups.value.filter((id) => !groupsStore.getGroupById(id)?.id);
});

// итоговые данные для импорта
const selectedData = computed(() => {
  const data: IGroupsExport = { groupIdsDictByFolderName: {} };
  data.groupIdsDictByFolderName = Array.from(folders.value).reduce(
    (dict, folder) => {
      dict[folder] = importData.value!.groupIdsDictByFolderName[folder];
      return dict;
    },
    {} as IGroupsExport["groupIdsDictByFolderName"],
  );
  return data;
});

const foldersChanged = computed(() => {
  return Object.entries(selectedData.value.groupIdsDictByFolderName).reduce(
    (count, [folder, ids]) => {
      count += ids.filter((id) => {
        const localGroup = groupsStore.getLocalGroupById(id);
        return localGroup && localGroup.folder !== folder;
      }).length;
      return count;
    },
    0,
  );
});

watch(
  importShortLinks,
  async (importShortLinks) => {
    if (!importShortLinks.length) {
      return;
    }

    const loadingFinisher = appStore.getLoadingFinisher();

    try {
      let encodedImportData = "";
      const vk = await vkStore.getApiService();
      try {
        for (const shortLink of importShortLinks) {
          const { link } = await vk.utilsCheckLink({ url: shortLink });
          const encodedChunk = link.replace(VK_SHORT_LINK.exportPrefix, "");
          encodedImportData += encodedChunk;
        }
      } catch (ex: any) {
        console.warn("Import data not found:", ex);
        dialogStore.alert({
          title: t("error"),
          subtitle: t("importNotFound", { error: ex.message ?? ex }),
        });
        return;
      }

      try {
        importData.value = decodeAndDecompressObject(encodedImportData);
      } catch (ex: any) {
        console.warn("Import data corrupted:", ex);
        dialogStore.alert({
          title: t("error"),
          subtitle: t("importCorrupted", { error: ex.message ?? ex }),
        });
        return;
      }

      const query = Object.assign({}, route.query);
      delete query.importHashes;
      await router.replace({ query });
      onShow();
    } finally {
      loadingFinisher();
    }
  },
  { immediate: true },
);

const onImportFileChange = (event: any) => {
  if (!event.target?.files?.length) {
    return;
  }

  const file = event.target.files[0];
  const mb = file.size / 1000000;
  if (mb > 1) {
    dialogStore.alert({
      title: t("error"),
      subtitle: t("fileTooLarge"),
    });
    return;
  }

  if (!file.name?.endsWith(".json")) {
    dialogStore.alert({
      title: t("error"),
      subtitle: t("wrongFormat"),
    });
    return;
  }

  const reader = new FileReader();

  const onload = appStore.wrapLoading(async (e) => {
    let data: any;
    try {
      data = JSON.parse(e.target!.result as string);
    } catch {
      dialogStore.alert({
        title: t("error"),
        subtitle: t("fileCorrupted"),
      });
      return;
    }

    if (!isGroupsExport(data)) {
      dialogStore.alert({
        title: t("importError"),
        subtitle: t("invalidData"),
      });
      return;
    }

    const dict = data.groupIdsDictByFolderName;
    for (const folder of Object.keys(dict)) {
      // убираем возможные дубли в данных
      dict[folder] = [...new Set(dict[folder])];
    }
    importData.value = data;
    show.value = true;
  });

  reader.onload = onload;
  reader.readAsText(file);
};

const onSaveImport = async () => {
  const foldersChangedValue = foldersChanged.value;
  const oldGroupsCount = groupsStore.localGroupsMap.size;
  groupsStore.saveImport(selectedData.value);
  await groupsStore.autoSaveCurrentLocalGroups();
  await groupsStore.loadNotLoadGroups();
  const newGroupsCount = groupsStore.localGroupsMap.size;
  dialogStore.alert({
    title: t("importComplete"),
    subtitle: t("importResult", {
      newGroups: newGroupsCount - oldGroupsCount,
      folderUpdates: foldersChangedValue,
    }),
  });
  show.value = false;
};

watch(importFolders, () => {
  folders.value = new Set<string>(importFolders.value);
});
</script>
<template>
  <VDialog
    :fullscreen="true"
    :model-value="show"
    :scrim="false"
    close-on-back
    transition="dialog-bottom-transition"
    @update:model-value="show = $event"
  >
    <template v-slot:activator="{ props }">
      <VBtn :prepend-icon="Icon24UploadOutline" color="green-darken-4">
        <label>
          {{ t("load") }}
          <input
            :key="show ? '1' : '2'"
            accept=".json"
            style="display: none"
            type="file"
            @change="onImportFileChange"
          />
        </label>
      </VBtn>
    </template>
    <VCard v-if="importData">
      <BaseToolbar>
        <VBtn icon @click="onClose">
          <Icon24CancelOutline />
        </VBtn>
        <VToolbarTitle class="navigation-caption">
          {{ t("loadBackup") }}
        </VToolbarTitle>
      </BaseToolbar>
      <VCardText style="font-size: 14px">
        {{ t("selectFolders") }}
        <template v-if="selectedGroups.length != selectedNewGroups.length">
          {{ t("newGroupsSelected") }}
          <b>{{ selectedNewGroups.length }} </b>.
        </template>
        <template v-if="foldersChanged > 0">
          {{ t("folderUpdatesSelected") }}
          <b>{{ foldersChanged }} </b>.
        </template>
      </VCardText>
      <VList class="mb-2" density="compact" style="flex-grow: 100">
        <VListItem
          v-if="groupsStore.folders.length > 1"
          :subtitle="t('groupsCount', { count: importGroupsCount })"
          :variant="
            folders.size === groupsStore.folders.length ? 'tonal' : 'flat'
          "
          :title="t('all')"
          @click="
            folders.size === importFolders.length
              ? folders.clear()
              : (folders = new Set(importFolders))
          "
        >
          <template v-slot:prepend>
            <VCheckbox
              :model-value="folders.size === importFolders.length"
              class="pe-2"
              hide-details
            />
          </template>
        </VListItem>
        <VListItem
          v-for="folder of importFolders"
          :key="folder"
          :subtitle="t('groupsCount', { count: importData.groupIdsDictByFolderName[folder].length })"
          :title="folder"
          :variant="folders.has(folder) ? 'tonal' : 'flat'"
          @click="
            folders.has(folder) ? folders.delete(folder) : folders.add(folder)
          "
        >
          <template v-slot:prepend>
            <VCheckbox
              :model-value="folders.has(folder)"
              class="pe-2"
              hide-details
            />
          </template>
        </VListItem>
      </VList>
      <VSheet
        class="mx-auto px-4 mb-2 d-flex justify-center align-center"
        style="gap: 10px"
      >
        <div>
          <VChip
            :disabled="selectedGroups.length === 0"
            hide-details
            style="height: auto; padding-inline: 20px"
          >
            <div class="text-center">
              <h2 class="text-md-h6">{{ t("selected") }}</h2>
              <span>
                {{ t("folders") }}:
                <b class="a-import__counter">{{ folders.size }}</b> &nbsp;
                &nbsp; {{ t("groups") }}:
                <b class="a-import__counter">
                  {{ selectedGroups.length }}
                </b>
              </span>
            </div>
          </VChip>
        </div>
        <VBtn
          :disabled="selectedGroups.length === 0"
          :icon="Icon24MemoryCard"
          color="light-blue-darken-4"
          :title="t('save')"
          @click="onSaveImport"
        />
      </VSheet>
    </VCard>
  </VDialog>
</template>
<style lang="scss">
.a-import__counter {
  display: inline-block;
  min-width: 25px;
}
</style>
