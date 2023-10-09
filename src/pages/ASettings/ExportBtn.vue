<script lang="ts" setup>
import useClipboard from "vue-clipboard3";
import { icons, styledIcons } from "@/common/consts";
import { computed, ref } from "vue";
import { useGroups } from "@/store/groups/groups";

const exportShow = ref(false);
const onClose = () => (exportShow.value = false);
const onShow = () => (exportShow.value = true);
const groupsStore = useGroups();
const folders = ref(new Set<string>(groupsStore.folders));
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
</script>
<template>
  <VDialog
    :fullscreen="true"
    :model-value="exportShow"
    :scrim="false"
    transition="dialog-bottom-transition"
    @update:model-value="exportShow = $event"
  >
    <template v-slot:activator="{ props }">
      <VBtn
        :prepend-icon="icons.Icon24DownloadOutline"
        class="a-button__left-content"
        color="light-blue-darken-4"
        @click="onShow"
      >
        Скачать все группы (экспорт)
      </VBtn>
    </template>
    <VCard>
      <VToolbar>
        <VBtn icon @click="onClose">
          <VIcon>mdi-close</VIcon>
        </VBtn>
        <VToolbarTitle>Настройки экспорта</VToolbarTitle>
        <VSpacer />
        <VToolbarItems>
          <VBtn
            :icon="icons.Icon24DownloadOutline"
            @click="groupsStore.downloadExport(groupsExport)"
          />
          <VBtn
            :icon="styledIcons.Icon24CopyOutline"
            @click="
              toClipboard(JSON.stringify(groupsExport), $event.target);
              win.alert('Данные для импорта помещены в буфер обмена.');
            "
          />
        </VToolbarItems>
      </VToolbar>
      <VCardText>
        Выберите папки и нажмите иконку <b>СКАЧАТЬ</b>. Если скачивание не
        сработало, можете скопировать данные в буфер обмена с помощью иконки
        <b>СКОПИРОВАТЬ</b> и вручную создать файл <b>.json</b> и поместить туда
        скопированные данные.
      </VCardText>
      <VList density="compact">
        <VListItem
          :subtitle="`Групп: ${groupsStore.localGroupsArray.length}`"
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
      <v-sheet
        class="d-flex align-center justify-center flex-wrap text-center mx-auto px-4"
      >
        <div>
          <h2 class="text-h6 font-weight-black">Выбрано</h2>
          <VChip class="text-h7 font-weight-medium mb-2">
            Папок: {{ folders.size }} &nbsp; &nbsp; Групп:
            {{ selectedGroupsCount }}
          </VChip>
        </div>
      </v-sheet>
    </VCard>
  </VDialog>
</template>
