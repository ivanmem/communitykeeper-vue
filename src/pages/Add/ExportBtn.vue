<script lang="ts" setup>
import useClipboard from "vue-clipboard3";
import { icons, styledIcons, VK_SHORT_LINK } from "@/shared/constants/consts";
import { computed, onDeactivated, ref, watch } from "vue";
import { useGroups } from "@/store/groups/groups";
import BaseToolbar from "@/components/BaseToolbar";
import { useDialog } from "@/store/dialog/dialog";
import { useApp } from "@/store/app/app";
import { useVk } from "@/store/vk/vk";
import { chunkString } from "@/shared/helpers/chunkString";
import { compressAndEncodeObject } from "@/shared/helpers/compressAndEncode";

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
const win = window;

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
    title: "Создание резервной копии в виде публичной ссылки",
    subtitle:
      "Приложение от Вашего имени воспользуется сервисом vk.cc для сокращения ссылок. Если Вам будет нужно обнулить ссылку, перейдите на сайт vk.cc и удалите все сокращённые ссылки, ведущие на вымышленный сайт s.vk. Вы подтверждаете создание ссылки?",
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
    console.warn("Произошла неизвестная ошибка при экспорте данных:", ex);
    dialogStore.alert("Произошла неизвестная ошибка при экспорте данных.");
    return;
  }

  const url = `https://vk.com/app${useApp().appId}#/add/?importHashes=${shortLinkHashes.join(",")}`;
  await toClipboard(url, event.target);
  showSelectExportMode.value = false;
  dialogStore.alert(`Ссылка помещена в буфер обмена:\n${url}`);
}

async function onDownloadJsonFile() {
  groupsStore.downloadExport(groupsExport.value);
  showSelectExportMode.value = false;
}

async function onCopyJson(event: any) {
  await toClipboard(JSON.stringify(groupsExport.value), event.target);
  showSelectExportMode.value = false;
  dialogStore.alert("Данные для импорта помещены в буфер обмена.");
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
        :prepend-icon="icons.Icon24DownloadOutline"
        color="light-blue-darken-4"
        @click="onShow"
      >
        Создать
      </VBtn>
    </template>
    <VCard>
      <BaseToolbar>
        <VBtn icon @click="onClose">
          <VIcon>mdi-close</VIcon>
        </VBtn>
        <VToolbarTitle class="navigation-caption">
          Создание резервной копии
        </VToolbarTitle>
      </BaseToolbar>
      <VCardText class="pb-2" style="font-size: 14px">
        Выберите экспортируемые папки и нажмите на кнопку Создать.
      </VCardText>
      <VList class="mb-2" density="compact" style="flex-grow: 100">
        <VListItem
          v-if="groupsStore.folders.length > 1"
          :subtitle="`Групп: ${groupsStore.localGroupsArray.length}`"
          :variant="
            folders.size === groupsStore.folders.length ? 'tonal' : 'flat'
          "
          title="Все"
          @click="
            folders.size === groupsStore.folders.length
              ? folders.clear()
              : (folders = new Set(groupsStore.folders))
          "
        >
          <template v-slot:prepend>
            <VCheckbox
              :model-value="folders.size === groupsStore.folders.length"
              class="pe-2"
              hide-details
            />
          </template>
        </VListItem>
        <VListItem
          v-for="folder of groupsStore.folders"
          :key="folder"
          :subtitle="`Групп: ${groupsStore.groupIdsDictByFolderName[folder].length}`"
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
              <h2 class="text-md-h6">Выбрано</h2>
              <span>
                Папок:
                <b class="a-export__counter">{{ folders.size }}</b> &nbsp;
                &nbsp; Групп:
                <b class="a-export__counter">{{ selectedGroupsCount }}</b>
              </span>
            </div>
          </VChip>
        </div>

        <VBtn
          :disabled="selectedGroupsCount === 0"
          :icon="icons.Icon24DownloadOutline"
          color="light-blue-darken-4"
          title="Создать"
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
        <VCardTitle>Выберите способ экспорта</VCardTitle>
        <VCardText v-if="appStore.isApp">
          🆘 Создание ФАЙЛА резервной копии не работает с приложения ВКонтакте.
          Если вам нужен именно ФАЙЛ, тогда воспользуйтесь кнопкой копирования и
          вручную создайте файл с расширением <b>.json</b>.
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
            :prepend-icon="icons.Icon24DownloadOutline"
            variant="flat"
            @click="onDownloadJsonFile"
          >
            Скачать JSON файл
          </VBtn>
          <VBtn
            :disabled="selectedGroupsCount === 0"
            :prepend-icon="styledIcons.Icon24CopyOutline"
            variant="flat"
            @click="onCopyJson"
          >
            Скопировать в формате JSON
          </VBtn>
          <VBtn
            :disabled="selectedGroupsCount === 0"
            :prepend-icon="icons.Icon24Linked"
            variant="flat"
            @click="onCopyLink"
          >
            Создать ссылку
          </VBtn>
        </div>

        <VCardActions>
          <VSpacer />
          <VBtn @click="showSelectExportMode = false">Закрыть</VBtn>
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
