<script lang="ts" setup>
import { icons } from "@/common/consts";
import { ref } from "vue";
import { useGroups } from "@/store/groups/groups";
import useClipboard from "vue-clipboard3";

const exportShow = ref(false);
const groupsStore = useGroups();
const { toClipboard } = useClipboard({ appendToBody: true });
const win = window;
</script>
<template>
  <VBtn
    :prepend-icon="icons.Icon24DownloadOutline"
    class="a-button__left-content"
    color="light-blue-darken-4"
    @click="
      groupsStore.downloadExport();
      exportShow = true;
    "
  >
    Скачать все группы (экспорт)
  </VBtn>

  <VDialog v-model="exportShow">
    <VCard class="overflow-block a-group-filters">
      <VCardTitle>Экспорт</VCardTitle>
      <VCardText
        >Если экспорт прошёл успешно, то нажмите кнопку Закрыть. Иначе
        скопируйте данные в буфер обмена и вставьте в текстовый
        <b>.json</b> файл.</VCardText
      >
      <VCardActions>
        <VBtn @click="exportShow = false">Закрыть</VBtn>
        <VBtn
          @click="
            toClipboard(JSON.stringify(groupsStore.getExport()), $event.target);
            win.alert('Экспорт помещён в буфер обмена.');
          "
          >Скопировать
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
