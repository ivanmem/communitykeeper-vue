<script lang="ts" setup>
import { useAppCaption } from "@/composables/useAppCaption";
import { computed, onActivated, reactive, ref, watch } from "vue";
import { useGroups } from "@/store/groups/groups";
import toNumber from "lodash/toNumber";
import { icons } from "@/common/consts";
import { getGroupsByLinksOrIds } from "@/helpers/getGroupsByIds";
import { IGroup } from "@/store/groups/types";
import AGroupLink from "/src/pages/AGroups/AGroupLink.vue";
import { useRoute } from "vue-router";
import { toStr } from "@/helpers/toStr";
import { AAddQueryParams } from "@/pages/AAdd/types";
import { useApp } from "@/store/app/app";
import { isGroupsExport } from "@/store/groups/isGroupsExport";
import { useDialog } from "@/store/dialog/dialog";
import ExportBtn from "@/pages/ASettings/ExportBtn.vue";

useAppCaption("Добавление групп");
const route = useRoute();
const groupsStore = useGroups();
const dialogStore = useDialog();
const queryParams = computed(() => route.query as AAddQueryParams);
const newGroup = reactive({
  id: "",
  folder: "",
  linkOrId: "",
});

const addGroup = async () => {
  const id = toNumber(newGroup.id);
  if (id <= 0) {
    return;
  }

  groupsStore.addLocalGroup({ id, folder: newGroup.folder });
  newGroup.id = "";
  currentGroup.value = undefined;
  newGroup.linkOrId = "";
  await groupsStore.loadNotLoadGroups();
  await groupsStore.autoSaveCurrentLocalGroups();
};

const removeGroup = async () => {
  const id = toNumber(newGroup.id);
  if (id <= 0) {
    return;
  }

  groupsStore.removeLocalGroup(id);
  currentGroup.value = undefined;
  newGroup.linkOrId = "";
  await groupsStore.autoSaveCurrentLocalGroups();
};

const isGroupAdded = computed(
  () => newGroup.id && groupsStore.localGroups[newGroup.id],
);

const currentGroup = ref<undefined | IGroup>();

const onLinkOrIdChanged = async () => {
  if (toStr(currentGroup.value?.id) === toStr(newGroup.linkOrId)) {
    return;
  }

  const groups = await getGroupsByLinksOrIds([newGroup.linkOrId]);
  if (groups.length <= 0) {
    currentGroup.value = undefined;
    return;
  }

  currentGroup.value = groups[0];
};

const onImportFileChange = (event: any) => {
  if (!event.target?.files?.length) {
    return;
  }

  const reader = new FileReader();

  const onload = useApp().wrapLoading(async (e) => {
    const data = JSON.parse(e.target!.result as string);
    if (!isGroupsExport(data)) {
      dialogStore.alert({
        title: "Ошибка импорта",
        subtitle: "Некорректные данные.",
      });
      return;
    }

    const oldGroupsCount = groupsStore.localGroupsArray.length;
    groupsStore.saveImport(data);
    await groupsStore.autoSaveCurrentLocalGroups();
    const newGroupsCount = groupsStore.localGroupsArray.length;
    dialogStore.alert({
      title: "Импорт завершён",
      subtitle: `Новых групп: ${newGroupsCount - oldGroupsCount}.`,
    });
  });

  reader.onload = onload;

  reader.readAsText(event.target.files[0]);
};

const onRemoveAllGroups = async () => {
  const isConfirm = confirm("Вы уверены, что хотите удалить все группы?");
  if (isConfirm) {
    groupsStore.removeLocalGroups();
    await groupsStore.autoSaveCurrentLocalGroups();
  }
};

watch(currentGroup, () => {
  newGroup.id = currentGroup.value?.id.toString() ?? "";
});

onActivated(() => {
  const { groupId, folder } = queryParams.value;
  newGroup.linkOrId = groupId || newGroup.linkOrId;
  newGroup.folder = folder || newGroup.folder;
  return onLinkOrIdChanged();
});
</script>

<template>
  <VCard class="overflow-block a-add">
    <VCardItem>
      <VCardTitle style="margin-bottom: 10px">Резервная копия</VCardTitle>
      <VRow no-gutters style="gap: 10px">
        <VBtn :prepend-icon="icons.Icon24UploadOutline" color="green-darken-4">
          <label>
            Загрузить
            <input
              accept=".json"
              style="display: none"
              type="file"
              @change="onImportFileChange"
            />
          </label>
        </VBtn>
        <ExportBtn />
      </VRow>
      <VCardTitle style="margin-block: 10px">Добавить группу</VCardTitle>
      <VTextField
        :append-inner-icon="icons.Icon16Link"
        :model-value="newGroup.linkOrId.length ? newGroup.linkOrId : undefined"
        label="Ссылка"
        @blur="onLinkOrIdChanged"
        @update:model-value="newGroup.linkOrId = $event ?? ''"
      />
      <VCombobox
        :append-inner-icon="icons.Icon16FolderOutline"
        :items="groupsStore.folders"
        :model-value="newGroup.folder.length ? newGroup.folder : undefined"
        label="Папка"
        @update:model-value="newGroup.folder = $event ?? ''"
      />
      <VRow no-gutters style="gap: 10px">
        <VBtn
          :disabled="!currentGroup"
          :prepend-icon="icons.Icon24AddSquareOutline"
          @click="addGroup"
        >
          {{ isGroupAdded ? "Заменить" : "Добавить" }}
        </VBtn>
        <VBtn
          :disabled="!isGroupAdded"
          :prepend-icon="icons.Icon24DeleteOutline"
          data-color="red"
          @click="removeGroup"
        >
          <span>Удалить</span>
        </VBtn>
        <VBtn
          :disabled="groupsStore.localGroupsArray.length === 0"
          :prepend-icon="icons.Icon24DeleteOutline"
          color="deep-orange"
          @click="onRemoveAllGroups"
        >
          Удалить всё
        </VBtn>
      </VRow>
    </VCardItem>
    <VCardItem>
      <VCardText
        v-if="isGroupAdded"
        class="a-rectangle-block"
        data-color="green"
      >
        Группа уже добавлена в папку "{{
          groupsStore.localGroups[newGroup.id].folder
        }}".
      </VCardText>
    </VCardItem>
    <VCardItem>
      <AGroupLink v-if="currentGroup" :group="currentGroup" />
    </VCardItem>
  </VCard>
</template>
<style lang="scss"></style>
