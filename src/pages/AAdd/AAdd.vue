<script lang="ts" setup>
import AButton from "../../components/AButton/AButton.vue";
import APageContainer from "../../components/APageContainer/APageContainer.vue";
import { useAppCaption } from "../../hooks/useAppCaption";
import { computed, reactive } from "vue";
import { useGroups } from "../../store/groups/groups";
import { toNumber } from "lodash";

useAppCaption("Добавить");
const store = useGroups();
const newGroup = reactive({
  id: "",
  folder: "",
});

const addGroup = async () => {
  const id = toNumber(newGroup.id);
  if (id <= 0) {
    return;
  }

  store.addLocalGroup({ id, folder: newGroup.folder });
  newGroup.id = "";
  await store.loadNotLoadGroups();
};

const saveChanges = () => {
  return store.saveCurrentLocalGroups();
};

const isGroupAdded = computed(
  () => newGroup.id && store.localGroups[newGroup.id]
);
</script>

<template>
  <APageContainer class="a-add">
    <label>
      <span>ID</span>
      <input v-model="newGroup.id" />
    </label>
    <label>
      <span>Папка</span>
      <input v-model="newGroup.folder" />
    </label>
    <AButton
      style="width: 250px"
      icon="Icon16Link"
      @click="addGroup"
    >
      <span>Добавить</span>
    </AButton>
    <AButton style="width: 250px" icon="Icon16Link" @click="saveChanges">
      <span>Сохранить изменения</span>
    </AButton>
    <div style="color: red" v-if="isGroupAdded">
      Группа уже добавлена в папку "{{
        store.localGroups[newGroup.id].folder
      }}". Она будет перезаписана.
    </div>
  </APageContainer>
</template>
<style lang="scss">
.a-add {
  label {
    span {
      display: inline-block;
      width: 80px;
    }
  }
}
</style>
