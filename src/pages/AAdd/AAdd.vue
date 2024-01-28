<script lang="ts" setup>
import { computed, reactive, ref, watch } from "vue";
import { useGroups } from "@/store/groups/groups";
import toNumber from "lodash/toNumber";
import { icons } from "@/common/consts";
import { getGroupsByLinksOrIds } from "@/helpers/getGroupsByIds";
import { IGroup } from "@/store/groups/types";
import AGroupLink from "/src/pages/AGroups/AGroupLink.vue";
import { useRoute } from "vue-router";
import { toStr } from "@/helpers/toStr";
import { AAddQueryParams } from "@/pages/AAdd/types";
import { useDialog } from "@/store/dialog/dialog";
import ExportBtn from "@/pages/AAdd/ExportBtn.vue";
import ImportBtn from "@/pages/AAdd/ImportBtn.vue";
import FixedTeleport from "@/components/FixedTeleport.vue";
import { useActivated } from "@/composables/useActivated";
import { folderRules, maxFolderLength } from "@/common/formConsts";
import { watchDebounced } from "@vueuse/core";

const route = useRoute();
const groupsStore = useGroups();
const dialogStore = useDialog();
const queryParams = computed(() => route.query as AAddQueryParams);
const newGroup = reactive({
  id: "",
  folder: "",
  linkOrId: "",
});
const isActivated = useActivated();

const addGroup = async () => {
  const id = toNumber(newGroup.id);
  if (id <= 0) {
    return;
  }

  const group = currentGroup.value;
  const linkOrId = newGroup.linkOrId;
  try {
    groupsStore.addLocalGroup({ id, folder: newGroup.folder });
    newGroup.id = "";
    currentGroup.value = undefined;
    newGroup.linkOrId = "";
    await groupsStore.autoSaveCurrentLocalGroups();
    await groupsStore.loadNotLoadGroups();
    const name = group?.name ?? linkOrId;
    let subtitle = `Группа "${name}" добавлена в папку "${newGroup.folder}".`;
    if (!groupsStore.config.autoSave) {
      subtitle += `\nНе забудьте сохраниться во вкладке "Настройки".`;
    }

    dialogStore.alert({
      title: "Добавление завершено",
      subtitle,
    });
  } catch (ex: any) {
    dialogStore.alert({
      title: "Ошибка",
      subtitle: `Группа не была добавлена из-за ошибки:\n${toStr(ex)}`,
    });
  }
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
  // вк для несуществующих сообществ возвращает объект с пустым именем
  if (groups.length <= 0 || !groups[0].name) {
    currentGroup.value = undefined;
    return;
  }

  currentGroup.value = groups[0];
};

const onRemoveAllGroups = async () => {
  const isConfirm = await dialogStore.confirm(
    "Вы уверены, что хотите удалить все группы?",
  );
  if (isConfirm) {
    groupsStore.removeLocalGroups();
    await groupsStore.autoSaveCurrentLocalGroups();
  }
};

watch(currentGroup, () => {
  newGroup.id = currentGroup.value?.id.toString() ?? "";
});

const onHelp = () => {
  dialogStore.alert({
    title: "💡 Справка",
    subtitle: `Во вкладке "Добавить" Вы можете:
- добавить или удалить группы;
- создать или применить резервную копию.`,
  });
};

// для подгрузки текущей группы без смены фокуса на поле используем debounce
watchDebounced(
  () => newGroup.linkOrId,
  () => {
    onLinkOrIdChanged();
  },
  { debounce: 1000 },
);

watch(
  isActivated,
  () => {
    if (!isActivated.value) {
      return;
    }

    const { groupId, folder } = queryParams.value;
    newGroup.linkOrId = groupId || newGroup.linkOrId;
    newGroup.folder = folder || newGroup.folder;
    return onLinkOrIdChanged();
  },
  { immediate: true },
);

const valid = ref(false);
</script>

<template>
  <FixedTeleport to="#navigation-header__right">
    <VBtn :icon="icons.Icon16InfoCircle" variant="text" @click="onHelp" />
  </FixedTeleport>
  <VCard class="overflow-block a-add">
    <VCardItem style="padding-top: 12px">
      <VCardSubtitle style="margin-bottom: 10px">
        💾 Резервная копия
      </VCardSubtitle>
      <VRow no-gutters style="gap: 10px">
        <ImportBtn />
        <ExportBtn />
      </VRow>
    </VCardItem>
    <VDivider />
    <VForm v-model="valid">
      <VCardItem style="max-width: max-content">
        <VCardSubtitle style="margin-block: 10px">
          🆕 Добавить группу
        </VCardSubtitle>
        <VTextField
          :append-inner-icon="icons.Icon16Link"
          :model-value="
            newGroup.linkOrId.length ? newGroup.linkOrId : undefined
          "
          hide-details="auto"
          label="Ссылка"
          @blur="onLinkOrIdChanged"
          @update:model-value="newGroup.linkOrId = $event ?? ''"
        />
        <VCombobox
          :append-inner-icon="icons.Icon16FolderOutline"
          :counter="maxFolderLength"
          :items="groupsStore.folders"
          :model-value="newGroup.folder.trim() || undefined"
          :rules="folderRules"
          label="Папка"
          required
          @update:model-value="newGroup.folder = ($event ?? '').trim()"
        />
        <VRow no-gutters style="gap: 10px; margin-top: 10px">
          <VBtn
            :disabled="!currentGroup || !valid || !newGroup.folder.trim()"
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
            :prepend-icon="icons.Icon24TrashSmileOutline"
            color="deep-orange"
            @click="onRemoveAllGroups"
          >
            Удалить все группы
          </VBtn>
        </VRow>
      </VCardItem>
    </VForm>
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
<style lang="scss">
.a-add {
}
</style>
