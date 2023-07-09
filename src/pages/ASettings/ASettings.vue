<script lang="ts" setup>
import { useAppCaption } from "@/composables/useAppCaption";
import { useGroups } from "@/store/groups/groups";
import AButton from "@/components/AButton/AButton.vue";
import { isGroupsExport } from "@/store/groups/isGroupsExport";
import { useApp } from "@/store/app/app";
import { useVk } from "@/store/vk/vk";
import { icons } from "@/common/consts";

useAppCaption("Настройки");
const groupsStore = useGroups();

const onImportFileChange = (event: any) => {
  if (!event.target?.files?.length) {
    return;
  }

  const reader = new FileReader();

  const onload = useApp().wrapLoading(async (e) => {
    const data = JSON.parse(e.target!.result as string);
    if (!isGroupsExport(data)) {
      window.alert("Некорректные данные.");
      return;
    }

    const oldGroupsCount = groupsStore.localGroupsArray.length;
    groupsStore.saveImport(data);
    await groupsStore.autoSaveCurrentLocalGroups();
    const newGroupsCount = groupsStore.localGroupsArray.length;
    window.alert(
      `Импорт завершён данные. Новых групп: ${newGroupsCount - oldGroupsCount}.`
    );
  });

  reader.onload = onload;

  reader.readAsText(event.target.files[0]);
};

const onRemoveAllGroups = async () => {
  const isConfirm = confirm("Вы уверены, что хотите удалить все группы?");
  if (isConfirm) {
    groupsStore.removeLocalGroups();
    await groupsStore.autoSaveCurrentLocalGroups();
  }
};

const { Icon24CloudOutline } = icons;
</script>

<template>
  <VCard class="overflow-block a-settings">
    <VCardItem style="max-width: 400px">
      <VRow no-gutters style="gap: 10px">
        <VBtn
          :prepend-icon="icons.Icon24CloudOutline"
          :color="
            groupsStore.spaceUsed >= 80
              ? 'deep-orange-darken-4'
              : 'green-darken-3'
          "
          style="pointer-events: none"
          class="a-button__left-content"
        >
          Занято места: {{ groupsStore.spaceUsed }}%
        </VBtn>
        <VBtn
          :prepend-icon="icons.Icon24UploadOutline"
          class="a-button__left-content"
          color="green-darken-4"
        >
          <label>
            Добавить группы (импорт)
            <input
              accept=".json"
              style="display: none"
              type="file"
              @change="onImportFileChange"
            />
          </label>
        </VBtn>
        <VBtn
          :prepend-icon="icons.Icon24DownloadOutline"
          class="a-button__left-content"
          color="light-blue-darken-4"
          @click="groupsStore.downloadExport()"
        >
          Скачать все группы (экспорт)
        </VBtn>
        <VBtn
          :disabled="groupsStore.localGroupsArray.length === 0"
          :prepend-icon="icons.Icon24DeleteOutline"
          class="a-button__left-content"
          color="deep-orange"
          @click="onRemoveAllGroups"
        >
          Удалить все группы
        </VBtn>
      </VRow>
    </VCardItem>
    <VCardItem>
      <VSwitch
        v-model="groupsStore.config.autoSave"
        density="compact"
        hide-details
        label="Автосохранение групп"
      />
      <span class="a-mini-text">
        Запросы ограничены до тысячи в час; За этот сеанс вы уже сделали:
        {{ useVk().vkWebAppStorageSetCount }}. Если вы попытаетесь сохраниться
        при лимите - все группы будут утеряны!
        <br />
        Этот параметр не влияет на сохранение настроек. Они будут сохраняться
        автоматически в любом случае.
      </span>
    </VCardItem>
    <VCardItem v-if="!groupsStore.config.autoSave">
      <VBtn
        class="a-button__left-content"
        variant="tonal"
        :prepend-icon="icons.Icon24MemoryCard"
        @click="groupsStore.saveCurrentLocalGroups()"
      >
        Сохранить группы
      </VBtn>
    </VCardItem>
    <VCardItem>
      <VSwitch
        v-model="groupsStore.config.showCounters"
        density="compact"
        hide-details
        label="Отображать счётчики количества фото\видео и так далее"
      />
      <span class="a-mini-text">Учтите, что придётся ждать их загрузку.</span>
    </VCardItem>
    <VCardItem>
      <VSwitch
        v-model="groupsStore.config.eruda"
        density="compact"
        hide-details
        label=" Включить дебаг кнопку (eruda)"
      />
    </VCardItem>
  </VCard>
</template>

<style lang="scss">
.a-settings {
  .v-switch .v-label {
    opacity: 1;
  }
}
</style>
