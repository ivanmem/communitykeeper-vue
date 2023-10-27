<script lang="ts" setup>
import { useAppCaption } from "@/composables/useAppCaption";
import { useGroups } from "@/store/groups/groups";
import { isGroupsExport } from "@/store/groups/isGroupsExport";
import { useApp } from "@/store/app/app";
import { useVk } from "@/store/vk/vk";
import { icons } from "@/common/consts";
import ExportBtn from "@/pages/ASettings/ExportBtn.vue";
import { useDialog } from "@/store/dialog/dialog";
import ASettingsDisabledCookies from "@/pages/ASettings/ASettingsDisabledCookies.vue";

useAppCaption("Настройки");
const groupsStore = useGroups();
const vkStore = useVk();
const dialogStore = useDialog();

const onImportFileChange = (event: any) => {
  if (!event.target?.files?.length) {
    return;
  }

  const reader = new FileReader();

  const onload = useApp().wrapLoading(async (e) => {
    const data = JSON.parse(e.target!.result as string);
    if (!isGroupsExport(data)) {
      dialogStore.alert({
        title: "Ошибка импорта",
        subtitle: "Некорректные данные.",
      });
      return;
    }

    const oldGroupsCount = groupsStore.localGroupsArray.length;
    groupsStore.saveImport(data);
    await groupsStore.autoSaveCurrentLocalGroups();
    const newGroupsCount = groupsStore.localGroupsArray.length;
    dialogStore.alert({
      title: "Импорт завершён",
      subtitle: `Новых групп: ${newGroupsCount - oldGroupsCount}.`,
    });
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
</script>

<template>
  <VCard class="overflow-block a-settings">
    <div class="d-flex flex-wrap">
      <ASettingsDisabledCookies />
      <VCardItem style="max-width: 400px">
        <VRow no-gutters style="gap: 10px">
          <VBtn
            :color="
              groupsStore.spaceUsed >= 80
                ? 'deep-orange-darken-4'
                : 'green-darken-3'
            "
            :prepend-icon="icons.Icon24CloudOutline"
            class="a-button__left-content"
            style="pointer-events: none"
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
          <ExportBtn />
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
    </div>
    <VCardItem>
      <VSwitch
        v-model="groupsStore.config.autoSave"
        hide-details
        label="Автосохранение групп"
      />
      <span class="a-mini-text">
        Запросы ограничены до тысячи в час; За этот сеанс вы уже сделали:
        {{ vkStore.vkWebAppStorageSetCount }}. Если вы попытаетесь сохраниться
        при лимите - все группы будут утеряны!
        <br />
        Этот параметр не влияет на сохранение настроек. Они будут сохраняться
        автоматически в любом случае.
      </span>
    </VCardItem>
    <VCardItem v-if="!groupsStore.config.autoSave">
      <VBtn
        :prepend-icon="icons.Icon24MemoryCard"
        class="a-button__left-content"
        variant="tonal"
        @click="groupsStore.saveCurrentLocalGroups()"
      >
        Сохранить группы
      </VBtn>
    </VCardItem>
    <VCardItem>
      <VSwitch
        v-model="groupsStore.config.showCounters"
        hide-details
        label="Отображать счётчики количества фото\видео и так далее"
      />
      <span class="a-mini-text">
        Если опция выключена, то вы можете вручную загрузить счётчики по клику
        на аватарку группы.
      </span>
    </VCardItem>
    <VCardItem>
      <VSwitch
        v-model="groupsStore.config.eruda"
        hide-details
        label=" Включить дебаг кнопку (eruda)"
      />
    </VCardItem>
  </VCard>
</template>

<style lang="scss">
.a-settings {
  .v-card-item__content {
    overflow: visible;
  }
}
</style>
