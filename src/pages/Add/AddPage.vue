<script lang="ts" setup>
import { computed, reactive, ref, watch } from "vue";
import { watchDebounced } from "@vueuse/core";
import { useRoute } from "vue-router";
import { toNumber } from "es-toolkit/compat";
import { useGroups } from "@/store/groups/groups";
import { useVk } from "@/store/vk/vk";
import { useDialog } from "@/store/dialog/dialog";
import { styledIcons } from "@/shared/constants/consts";
import { useActivated } from "@/shared/composables/useActivated";
import { folderRules, maxFolderLength } from "@/shared/constants/formConsts";
import { toStr } from "@/shared/helpers/toStr";
import { IGroup } from "@/store/groups/types";
import GroupLink from "/src/pages/Groups/GroupLink.vue";
import { AddPageQueryParams } from "@/pages/Add/types";
import ExportBtn from "@/pages/Add/ExportBtn.vue";
import ImportBtn from "@/pages/Add/ImportBtn.vue";
import FixedTeleport from "@/components/FixedTeleport";
import {
  Icon24AddSquareOutline,
  Icon24DeleteOutline,
  Icon24InfoCircleOutline,
  Icon24TrashSmileOutline,
} from "vue-vkontakte-icons";
import { useI18n } from "vue-i18n";

const { t } = useI18n({
  messages: {
    ru: {
      backup: "💾 Резервная копия",
      addGroup: "🆕 Добавить группу",
      link: "Ссылка",
      folder: "Папка",
      replace: "Заменить",
      add: "Добавить",
      delete: "Удалить",
      deleteAllGroups: "Удалить все группы",
      groupAlreadyAdded: 'Группа уже добавлена в папку "{folder}".',
      addComplete: "Добавление завершено",
      groupAddedToFolder: 'Группа "{name}" добавлена в папку "{folder}".',
      dontForgetToSave: 'Не забудьте сохраниться во вкладке "Настройки".',
      error: "Ошибка",
      groupNotAdded: "Группа не была добавлена из-за ошибки:\n{error}",
      confirmDeleteAll: "Вы уверены, что хотите удалить все группы?",
      helpTitle: "💡 Справка",
      helpText: `Во вкладке "Добавить" Вы можете:
- добавить или удалить группы;
- создать или применить резервную копию.`,
    },
    en: {
      backup: "💾 Backup",
      addGroup: "🆕 Add group",
      link: "Link",
      folder: "Folder",
      replace: "Replace",
      add: "Add",
      delete: "Delete",
      deleteAllGroups: "Delete all groups",
      groupAlreadyAdded: 'Group already added to folder "{folder}".',
      addComplete: "Adding complete",
      groupAddedToFolder: 'Group "{name}" added to folder "{folder}".',
      dontForgetToSave: 'Don\'t forget to save in the "Settings" tab.',
      error: "Error",
      groupNotAdded: "Group was not added due to error:\n{error}",
      confirmDeleteAll: "Are you sure you want to delete all groups?",
      helpTitle: "💡 Help",
      helpText: `In the "Add" tab you can:
- add or delete groups;
- create or apply a backup.`,
    },
  },
});

const route = useRoute();
const groupsStore = useGroups();
const dialogStore = useDialog();
const isActivated = useActivated();

const newGroup = reactive({
  id: "",
  folder: "",
  linkOrId: "",
});

const currentGroup = ref<undefined | IGroup>();
const valid = ref(false);

const queryParams = computed(() => route.query as AddPageQueryParams);
const localGroup = computed(() => groupsStore.getLocalGroupById(newGroup.id));
const isGroupAdded = computed(() => newGroup.id && localGroup.value);

const savedIsEqual = computed(() => {
  if (!localGroup.value) {
    return false;
  }

  return localGroup.value.folder === newGroup.folder;
});

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
    let subtitle = t("groupAddedToFolder", { name, folder: newGroup.folder });
    if (!groupsStore.config.autoSave) {
      subtitle += `\n${t("dontForgetToSave")}`;
    }

    dialogStore.alert({
      title: t("addComplete"),
      subtitle,
    });
  } catch (ex: any) {
    dialogStore.alert({
      title: t("error"),
      subtitle: t("groupNotAdded", { error: toStr(ex) }),
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

const onLinkOrIdChanged = async () => {
  if (toStr(currentGroup.value?.id) === toStr(newGroup.linkOrId)) {
    return;
  }

  const linkOrId =
    extractGroupIdFromPostLink(newGroup.linkOrId) ?? newGroup.linkOrId;
  const apiService = await useVk().getApiService();
  const groups = await apiService.getGroupsByLinksOrIds([linkOrId]);
  // вк для несуществующих сообществ возвращает объект с пустым именем
  if (groups.length <= 0 || !groups[0].name) {
    currentGroup.value = undefined;
    return;
  }

  currentGroup.value = groups[0];
};

const onRemoveAllGroups = async () => {
  const isConfirm = await dialogStore.confirm(t("confirmDeleteAll"));
  if (isConfirm) {
    groupsStore.removeLocalGroups();
    await groupsStore.autoSaveCurrentLocalGroups();
  }
};

const onHelp = () => {
  dialogStore.alert({
    title: t("helpTitle"),
    subtitle: t("helpText"),
  });
};

watch(currentGroup, () => {
  newGroup.id = currentGroup.value?.id.toString() ?? "";
});

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

// https://vk.com/wall-178374368_768 -> 178374368
function extractGroupIdFromPostLink(link: string): string | undefined {
  const match = link.match(/vk\.com\/wall-(\d+)_\d+/);
  return match?.[1];
}
</script>

<template>
  <FixedTeleport to="#navigation-header__right">
    <VBtn :icon="Icon24InfoCircleOutline" variant="text" @click="onHelp" />
  </FixedTeleport>
  <VCard class="overflow-block a-add">
    <VCardItem style="padding-top: 12px">
      <VCardSubtitle style="margin-bottom: 10px">
        {{ t("backup") }}
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
          {{ t("addGroup") }}
        </VCardSubtitle>
        <VTextField
          :append-inner-icon="styledIcons.Icon16Link"
          :model-value="
            newGroup.linkOrId.length ? newGroup.linkOrId : undefined
          "
          hide-details="auto"
          :label="t('link')"
          @blur="onLinkOrIdChanged"
          @update:model-value="newGroup.linkOrId = $event ?? ''"
        />
        <VCombobox
          :append-inner-icon="styledIcons.Icon16FolderOutline"
          :counter="maxFolderLength"
          :items="groupsStore.folders"
          :model-value="newGroup.folder.trim() || undefined"
          :rules="folderRules"
          :label="t('folder')"
          required
          @update:model-value="newGroup.folder = ($event ?? '').trim()"
        />
        <VRow no-gutters style="gap: 10px; margin-top: 10px">
          <VBtn
            :disabled="
              !currentGroup || !valid || !newGroup.folder.trim() || savedIsEqual
            "
            :prepend-icon="Icon24AddSquareOutline"
            @click="addGroup"
          >
            {{ isGroupAdded ? t("replace") : t("add") }}
          </VBtn>
          <VBtn
            :disabled="!isGroupAdded"
            :prepend-icon="Icon24DeleteOutline"
            data-color="red"
            @click="removeGroup"
          >
            <span>{{ t("delete") }}</span>
          </VBtn>
          <VBtn
            :disabled="groupsStore.localGroupsMap.size === 0"
            :prepend-icon="Icon24TrashSmileOutline"
            color="deep-orange"
            @click="onRemoveAllGroups"
          >
            {{ t("deleteAllGroups") }}
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
        {{
          t("groupAlreadyAdded", {
            folder: groupsStore.localGroupsMap.get(newGroup.id)!.folder,
          })
        }}
      </VCardText>
    </VCardItem>
    <VCardItem>
      <GroupLink v-if="currentGroup" :group="currentGroup" />
    </VCardItem>
  </VCard>
</template>
<style lang="scss"></style>
