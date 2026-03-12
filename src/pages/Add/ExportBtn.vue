<script lang="ts" setup>
import useClipboard from "vue-clipboard3";
import { styledIcons, VK_SHORT_LINK } from "@/shared/constants/consts";
import { computed, onDeactivated, ref, watch } from "vue";
import { useGroups } from "@/store/groups/groups";
import BaseToolbar from "@/components/BaseToolbar";
import { useDialog } from "@/store/dialog/dialog";
import { useApp } from "@/store/app/app";
import { useVk } from "@/store/vk/vk";
import { chunkString } from "@/shared/helpers/chunkString";
import { compressAndEncodeObject } from "@/shared/helpers/compressAndEncode";
import {
  Icon24CancelOutline,
  Icon24DownloadOutline,
  Icon24Linked,
} from "vue-vkontakte-icons";
import { useI18n } from "vue-i18n";

const { t } = useI18n({
  messages: {
    ru: {
      create: "Создать",
      createBackup: "Создание резервной копии",
      selectFolders:
        "Выберите экспортируемые папки и нажмите на кнопку Создать.",
      all: "Все",
      groupsCount: "Групп: {count}",
      selected: "Выбрано",
      folders: "Папок",
      groups: "Групп",
      selectExportMethod: "Выберите способ экспорта",
      appWarning:
        "🆘 Создание ФАЙЛА резервной копии не работает с приложения ВКонтакте. Если вам нужен именно ФАЙЛ, тогда воспользуйтесь кнопкой копирования и вручную создайте файл с расширением .json.",
      downloadJson: "Скачать JSON файл",
      copyJson: "Скопировать в формате JSON",
      createLink: "Создать ссылку",
      close: "Закрыть",
      createLinkTitle: "Создание резервной копии в виде публичной ссылки",
      createLinkConfirm:
        "Приложение от Вашего имени воспользуется сервисом vk.cc для сокращения ссылок. Если Вам будет нужно обнулить ссылку, перейдите на сайт vk.cc и удалите все сокращённые ссылки, ведущие на вымышленный сайт s.vk. Вы подтверждаете создание ссылки?",
      exportError: "Произошла неизвестная ошибка при экспорте данных.",
      linkCopied: "Ссылка помещена в буфер обмена:\n{url}",
      dataCopied: "Данные для импорта помещены в буфер обмена.",
    },
    en: {
      create: "Create",
      createBackup: "Create backup",
      selectFolders: "Select folders to export and click Create button.",
      all: "All",
      groupsCount: "Groups: {count}",
      selected: "Selected",
      folders: "Folders",
      groups: "Groups",
      selectExportMethod: "Select export method",
      appWarning:
        "🆘 Creating a backup FILE does not work from the VKontakte app. If you need a FILE, use the copy button and manually create a file with .json extension.",
      downloadJson: "Download JSON file",
      copyJson: "Copy as JSON",
      createLink: "Create link",
      close: "Close",
      createLinkTitle: "Create backup as public link",
      createLinkConfirm:
        "The app will use vk.cc service on your behalf to shorten links. If you need to reset the link, go to vk.cc and delete all shortened links leading to the fictional site s.vk. Do you confirm link creation?",
      exportError: "An unknown error occurred while exporting data.",
      linkCopied: "Link copied to clipboard:\n{url}",
      dataCopied: "Import data copied to clipboard.",
    },
  },
});

const show = ref(false);
const showSelectExportMode = ref(false);
const onClose = () => (show.value = false);
const onShow = () => (show.value = true);
const groupsStore = useGroups();
const appStore = useApp();
const vkStore = useVk();
const dialogStore = useDialog();
const folders = ref(new Set<string>());
const groupsExport = computed(() =>
  groupsStore.getExport(Array.from(folders.value)),
);
const selectedGroupsCount = computed(() => {
  return Object.values(groupsExport.value.groupIdsDictByFolderName).reduce(
    (sum, ids) => sum + ids.length,
    0,
  );
});
const { toClipboard } = useClipboard({ appendToBody: true });

watch(
  () => groupsStore.folders,
  () => {
    folders.value = new Set<string>(groupsStore.folders);
  },
  { immediate: true },
);

onDeactivated(() => {
  show.value = false;
});

async function onCopyLink(event: any) {
  const confirm = await dialogStore.confirm({
    title: t("createLinkTitle"),
    subtitle: t("createLinkConfirm"),
  });
  if (!confirm) {
    return;
  }

  const compressed = compressAndEncodeObject(groupsExport.value);
  const vk = await vkStore.getApiService();
  const chunks: string[] = chunkString(
    compressed,
    VK_SHORT_LINK.max - VK_SHORT_LINK.exportPrefix.length,
  );
  const shortLinkHashes: string[] = [];

  try {
    for (const chunk of chunks) {
      const url = VK_SHORT_LINK.exportPrefix + chunk;
      const { short_url } = await vk.utilsGetShortLink({ private: true, url });
      const hash = short_url.replace(VK_SHORT_LINK.shortPrefix, "");
      shortLinkHashes.push(hash);
    }
  } catch (ex) {
    console.warn("Export error:", ex);
    dialogStore.alert(t("exportError"));
    return;
  }

  const url = `https://vk.com/app${useApp().appId}#/add/?importHashes=${shortLinkHashes.join(",")}`;
  await toClipboard(url, event.target);
  showSelectExportMode.value = false;
  dialogStore.alert(t("linkCopied", { url }));
}

async function onDownloadJsonFile() {
  groupsStore.downloadExport(groupsExport.value);
  showSelectExportMode.value = false;
}

async function onCopyJson(event: any) {
  await toClipboard(JSON.stringify(groupsExport.value), event.target);
  showSelectExportMode.value = false;
  dialogStore.alert(t("dataCopied"));
}
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
      <VBtn
        :prepend-icon="Icon24DownloadOutline"
        color="light-blue-darken-4"
        @click="onShow"
      >
        {{ t("create") }}
      </VBtn>
    </template>
    <VCard>
      <BaseToolbar>
        <VBtn icon @click="onClose">
          <Icon24CancelOutline />
        </VBtn>
        <VToolbarTitle class="navigation-caption">
          {{ t("createBackup") }}
        </VToolbarTitle>
      </BaseToolbar>
      <VCardText class="pb-2" style="font-size: 14px">
        {{ t("selectFolders") }}
      </VCardText>
      <VList class="mb-2" density="compact" style="flex-grow: 100">
        <VListItem
          v-if="groupsStore.folders.length > 1"
          :subtitle="
            t('groupsCount', { count: groupsStore.localGroupsMap.size })
          "
          :variant="
            folders.size === groupsStore.folders.length ? 'tonal' : 'flat'
          "
          :title="t('all')"
          @click="
            folders.size === groupsStore.folders.length
              ? folders.clear()
              : (folders = new Set(groupsStore.folders))
          "
        >
          <template v-slot:prepend>
            <VCheckbox
              :indeterminate="
                groupsStore.folders.length > 0 &&
                folders.size !== groupsStore.folders.length
              "
              :model-value="folders.size === groupsStore.folders.length"
              class="pe-2"
              hide-details
            />
          </template>
        </VListItem>
        <VListItem
          v-for="folder of groupsStore.folders"
          :key="folder"
          :subtitle="
            t('groupsCount', {
              count: groupsStore.groupIdsDictByFolderName[folder].length,
            })
          "
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
            :disabled="selectedGroupsCount === 0"
            hide-details
            style="height: auto; padding-inline: 20px"
          >
            <div class="text-center">
              <h2 class="text-md-h6">{{ t("selected") }}</h2>
              <span>
                {{ t("folders") }}:
                <b class="a-export__counter">{{ folders.size }}</b> &nbsp;
                &nbsp; {{ t("groups") }}:
                <b class="a-export__counter">{{ selectedGroupsCount }}</b>
              </span>
            </div>
          </VChip>
        </div>

        <VBtn
          :disabled="selectedGroupsCount === 0"
          :icon="Icon24DownloadOutline"
          color="light-blue-darken-4"
          :title="t('create')"
          @click="showSelectExportMode = true"
        />
      </VSheet>
    </VCard>

    <VDialog
      v-model="showSelectExportMode"
      close-on-back
      max-width="max-content"
    >
      <VCard>
        <VCardTitle>{{ t("selectExportMethod") }}</VCardTitle>
        <VCardText v-if="appStore.isApp">
          {{ t("appWarning") }}
        </VCardText>
        <div
          style="
            max-width: 450px;
            display: flex;
            flex-direction: column;
            margin: 10px;
            align-items: flex-start;
          "
        >
          <VBtn
            :disabled="selectedGroupsCount === 0 || appStore.isApp"
            :prepend-icon="Icon24DownloadOutline"
            variant="flat"
            @click="onDownloadJsonFile"
          >
            {{ t("downloadJson") }}
          </VBtn>
          <VBtn
            :disabled="selectedGroupsCount === 0"
            :prepend-icon="styledIcons.Icon24CopyOutline"
            variant="flat"
            @click="onCopyJson"
          >
            {{ t("copyJson") }}
          </VBtn>
          <VBtn
            :disabled="selectedGroupsCount === 0"
            :prepend-icon="Icon24Linked"
            variant="flat"
            @click="onCopyLink"
          >
            {{ t("createLink") }}
          </VBtn>
        </div>

        <VCardActions>
          <VSpacer />
          <VBtn @click="showSelectExportMode = false">{{ t("close") }}</VBtn>
        </VCardActions>
      </VCard>
    </VDialog>
  </VDialog>
</template>
<style lang="scss">
.a-export__counter {
  display: inline-block;
  min-width: 25px;
}
</style>
