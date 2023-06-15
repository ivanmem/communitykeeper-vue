<script lang="ts" setup>
import AButton from "../../components/AButton/AButton.vue";
import APageContainer from "../../components/APageContainer/APageContainer.vue";
import { useAppCaption } from "../../hooks/useAppCaption";
import { computed, reactive, ref, watch } from "vue";
import { useGroups } from "../../store/groups/groups";
import { toNumber } from "lodash";
import { icons } from "../../common/consts";
import { getGroupsByLinksOrIds } from "../../helpers/getGroupsByIds";
import { IGroup } from "../../store/groups/types";
import AGroupLink from "../AGroups/AGroupLink.vue";

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
    <div class="overflow-block">
      <label class="form-label">
        <span><Icon16Link /> Ссылка</span>
        <input v-model="newGroup.linkOrId" @blur="onLinkOrIdChanged" />
      </label>
      <div style="color: red" v-if="isGroupAdded">
        Группа уже добавлена в папку "{{
          store.localGroups[newGroup.id].folder
        }}". Она будет перезаписана.
      </div>
      <label class="form-label">
        <span><Icon16FolderOutline /> Папка</span>
        <input v-model="newGroup.folder" />
      </label>
      <AButton
        :disabled="!currentGroup"
        class="form-button"
        icon="Icon16AddSquareOutline"
        @click="addGroup"
      >
        <span>Добавить</span>
      </AButton>
      <AButton
        class="form-button"
        icon="Icon16DeleteOutline"
        @click="removeGroup"
        v-if="isGroupAdded"
      >
        <span>Удалить</span>
      </AButton>
      <AGroupLink v-if="currentGroup" :group="currentGroup" :index="-1" />
    </div>
  </APageContainer>
</template>
<style lang="scss">
.a-add {
  .a-button {
    margin-top: 10px;
  }

  .form-label {
    margin-top: 5px;

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
