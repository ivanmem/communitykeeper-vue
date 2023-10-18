<script lang="ts" setup>
import { useAppCaption } from "@/composables/useAppCaption";
import { computed, onActivated, reactive, ref, watch } from "vue";
import { useGroups } from "@/store/groups/groups";
import { toNumber } from "lodash";
import { icons } from "@/common/consts";
import { getGroupsByLinksOrIds } from "@/helpers/getGroupsByIds";
import { IGroup } from "@/store/groups/types";
import AGroupLink from "/src/pages/AGroups/AGroupLink.vue";
import { useRoute } from "vue-router";
import { toStr } from "@/helpers/toStr";
import { AAddQueryParams } from "@/pages/AAdd/types";

useAppCaption("Добавить группу");
const route = useRoute();
const groupsStore = useGroups();
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
