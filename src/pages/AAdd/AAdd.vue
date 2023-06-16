<script lang="ts" setup>
import { useAppCaption } from "@/hooks/useAppCaption";
import { computed, reactive, ref, watch } from "vue";
import { useGroups } from "@/store/groups/groups";
import { toNumber } from "lodash";
import { icons } from "@/common/consts";
import { getGroupsByLinksOrIds } from "@/helpers/getGroupsByIds";
import { IGroup } from "@/store/groups/types";
import AGroupLink from "/src/pages/AGroups/AGroupLink.vue";
import AButton from "@/components/AButton/AButton.vue";
import APageContainer from "@/components/APageContainer/APageContainer.vue";

useAppCaption("Добавить");
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
  () => newGroup.id && store.localGroups[newGroup.id]
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
  <APageContainer class="a-add">
    <div class="overflow-block" style="gap: 10px">
      <label class="form-label">
        <span><Icon16Link /> Ссылка</span>
        <input v-model="newGroup.linkOrId" @blur="onLinkOrIdChanged" />
      </label>
      <label class="form-label">
        <span><Icon16FolderOutline /> Папка</span>
        <input v-model="newGroup.folder" />
      </label>
      <AButton
        :disabled="!currentGroup"
        class="a-button__left-content form-button"
        icon="Icon24AddSquareOutline"
        @click="addGroup"
      >
        <span>{{ isGroupAdded ? "Заменить" : "Добавить" }}</span>
      </AButton>
      <AButton
        class="a-button__left-content form-button"
        data-color="red"
        icon="Icon24DeleteOutline"
        @click="removeGroup"
        v-if="isGroupAdded"
      >
        <span>Удалить</span>
      </AButton>
      <div class="a-rectangle-block" data-color="green" v-if="isGroupAdded">
        Группа уже добавлена в папку "{{
          store.localGroups[newGroup.id].folder
        }}".
      </div>
      <AGroupLink v-if="currentGroup" :group="currentGroup" :index="-1" />
    </div>
  </APageContainer>
</template>
<style lang="scss">
.a-add {
  .a-button {
  }

  .form-label {
    span {
      display: inline-block;
      width: 130px;
    }
  }

  .form-button {
    width: 300px;
  }
}
</style>
