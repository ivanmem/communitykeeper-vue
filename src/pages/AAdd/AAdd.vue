<script lang="ts" setup>
import { useAppCaption } from "@/composables/useAppCaption";
import { computed, reactive, ref, watch } from "vue";
import { useGroups } from "@/store/groups/groups";
import { toNumber } from "lodash";
import { icons } from "@/common/consts";
import { getGroupsByLinksOrIds } from "@/helpers/getGroupsByIds";
import { IGroup } from "@/store/groups/types";
import AGroupLink from "/src/pages/AGroups/AGroupLink.vue";

useAppCaption("Добавить группу");
const store = useGroups();
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

  store.addLocalGroup({ id, folder: newGroup.folder });
  newGroup.id = "";
  currentGroup.value = undefined;
  newGroup.linkOrId = "";
  await store.loadNotLoadGroups();
  await store.autoSaveCurrentLocalGroups();
};

const removeGroup = async () => {
  const id = toNumber(newGroup.id);
  if (id <= 0) {
    return;
  }

  store.removeLocalGroup(id);
  currentGroup.value = undefined;
  newGroup.linkOrId = "";
  await store.autoSaveCurrentLocalGroups();
};

const isGroupAdded = computed(
  () => newGroup.id && store.localGroups[newGroup.id],
);

const currentGroup = ref<undefined | IGroup>();

const onLinkOrIdChanged = async () => {
  if (currentGroup.value?.id.toString() === newGroup.linkOrId) {
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
const { Icon16FolderOutline, Icon16Link } = icons;
</script>

<template>
  <VCard class="overflow-block a-add">
    <VCardItem>
      <VTextField
        :model-value="newGroup.linkOrId.length ? newGroup.linkOrId : undefined"
        :prepend-icon="icons.Icon16Link"
        label="Ссылка"
        @blur="onLinkOrIdChanged"
        @update:model-value="newGroup.linkOrId = $event ?? ''"
      />
      <VCombobox
        :items="useGroups().folders"
        :model-value="newGroup.folder.length ? newGroup.folder : undefined"
        :prepend-icon="icons.Icon16FolderOutline"
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
          store.localGroups[newGroup.id].folder
        }}".
      </VCardText>
    </VCardItem>
    <VCardItem>
      <AGroupLink v-if="currentGroup" :group="currentGroup" :index="-1" />
    </VCardItem>
  </VCard>
</template>
<style lang="scss"></style>
