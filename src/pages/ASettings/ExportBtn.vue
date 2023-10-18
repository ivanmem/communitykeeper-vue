<script lang="ts" setup>
import useClipboard from "vue-clipboard3";
import { icons, styledIcons } from "@/common/consts";
import { computed, ref, watch } from "vue";
import { useGroups } from "@/store/groups/groups";
import AToolbar from "@/components/AToolbar.vue";
import { useDialog } from "@/store/dialog/dialog";

const exportShow = ref(false);
const onClose = () => (exportShow.value = false);
const onShow = () => (exportShow.value = true);
const groupsStore = useGroups();
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
      <AToolbar>
        <VBtn icon @click="onClose">
          <VIcon>mdi-close</VIcon>
        </VBtn>
        <VToolbarTitle class="navigation-caption">Экспорт</VToolbarTitle>
      </AToolbar>
      <VCardText style="font-size: 14px">
        Выберите папки и нажмите на кнопку загрузки. Если загрузка не началась,
        скопируйте данные в буфер обмена с помощью кнопки копирования и вручную
        создайте файл с расширением
        <b>.json</b>.
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
        <VBtn
          :disabled="selectedGroupsCount === 0"
          :icon="icons.Icon24DownloadOutline"
          title="Скачать"
          variant="tonal"
          @click="groupsStore.downloadExport(groupsExport)"
        />
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
          :icon="styledIcons.Icon24CopyOutline"
          title="Скопировать"
          variant="tonal"
          @click="
            toClipboard(JSON.stringify(groupsExport), $event.target);
            dialogStore.alert('Данные для импорта помещены в буфер обмена.');
          "
        />
      </VSheet>
    </VCard>
  </VDialog>
</template>
<style lang="scss">
.a-export__counter {
  display: inline-block;
  min-width: 25px;
}
</style>
