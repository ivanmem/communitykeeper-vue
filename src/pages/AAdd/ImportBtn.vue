<script lang="ts" setup>
import { icons } from "@/common/consts";
import { computed, ref, watch } from "vue";
import { useGroups } from "@/store/groups/groups";
import AToolbar from "@/components/AToolbar.vue";
import { useDialog } from "@/store/dialog/dialog";
import { useApp } from "@/store/app/app";
import { isGroupsExport } from "@/store/groups/isGroupsExport";
import { IGroupsExport } from "@/store/groups/types";

const show = ref(false);
const onClose = () => (show.value = false);
const onShow = () => (show.value = true);
const groupsStore = useGroups();
const dialogStore = useDialog();
const appStore = useApp();
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

const onImportFileChange = (event: any) => {
  if (!event.target?.files?.length) {
    return;
  }

  const file = event.target.files[0];
  const mb = file.size / 1000000;
  if (mb > 1) {
    dialogStore.alert({
      title: "Ошибка",
      subtitle:
        "Слишком большой размер файла. Резервная копия не может быть больше мегабайта.",
    });
    return;
  }

  if (!file.name?.endsWith(".json")) {
    dialogStore.alert({
      title: "Ошибка",
      subtitle:
        "Неверный формат файла. Резервная копия должна быть в формате .json.",
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
        title: "Ошибка",
        subtitle: "Выбранный файл повреждён.",
      });
      return;
    }

    if (!isGroupsExport(data)) {
      dialogStore.alert({
        title: "Ошибка импорта",
        subtitle: "Некорректные данные.",
      });
      return;
    }

    const dict = data.groupIdsDictByFolderName;
    Object.keys(dict).forEach((folder) => {
      // убираем возможные дубли в данных
      dict[folder] = [...new Set(dict[folder])];
    });
    importData.value = data;
    show.value = true;
  });

  reader.onload = onload;
  reader.readAsText(file);
};

const onSaveImport = async () => {
  const foldersChangedValue = foldersChanged.value;
  const oldGroupsCount = groupsStore.localGroupsArray.length;
  groupsStore.saveImport(selectedData.value);
  await groupsStore.autoSaveCurrentLocalGroups();
  await groupsStore.loadNotLoadGroups();
  const newGroupsCount = groupsStore.localGroupsArray.length;
  dialogStore.alert({
    title: "Импорт завершён",
    subtitle: `Новых групп: ${
      newGroupsCount - oldGroupsCount
    }.\nОбновлений названий папок: ${foldersChangedValue}`,
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
      <VBtn :prepend-icon="icons.Icon24UploadOutline" color="green-darken-4">
        <label>
          Загрузить
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
      <AToolbar>
        <VBtn icon @click="onClose">
          <VIcon>mdi-close</VIcon>
        </VBtn>
        <VToolbarTitle class="navigation-caption">
          Загрузка резервной копии
        </VToolbarTitle>
      </AToolbar>
      <VCardText style="font-size: 14px">
        Выберите нужные папки и нажмите на кнопку сохранения. Названия папок у
        уже существующих групп будут обновлены на новые.
        <template v-if="selectedGroups.length != selectedNewGroups.length">
          Выбрано новых групп:
          <b>{{ selectedNewGroups.length }} </b>.
        </template>
        <template v-if="foldersChanged > 0">
          Выбрано обновлений названий папок:
          <b>{{ foldersChanged }} </b>.
        </template>
      </VCardText>
      <VList class="mb-2" density="compact" style="flex-grow: 100">
        <VListItem
          v-if="groupsStore.folders.length > 1"
          :subtitle="`Групп: ${importGroupsCount}`"
          :variant="
            folders.size === groupsStore.folders.length ? 'tonal' : 'flat'
          "
          title="Все"
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
          :subtitle="`Групп: ${importData.groupIdsDictByFolderName[folder].length}`"
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
              <h2 class="text-md-h6">Выбрано</h2>
              <span>
                Папок:
                <b class="a-import__counter">{{ folders.size }}</b> &nbsp;
                &nbsp; Групп:
                <b class="a-import__counter">
                  {{ selectedGroups.length }}
                </b>
              </span>
            </div>
          </VChip>
        </div>
        <VBtn
          :disabled="selectedGroups.length === 0"
          :prepend-icon="icons.Icon24MemoryCard"
          text="Сохранить"
          variant="text"
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
