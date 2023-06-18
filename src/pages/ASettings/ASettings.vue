<script lang="ts" setup>
import APageContainer from "@/components/APageContainer/APageContainer.vue";
import { useAppCaption } from "@/hooks/useAppCaption";
import { useGroups } from "@/store/groups/groups";
import AButton from "@/components/AButton/AButton.vue";
import { isGroupsExport } from "@/store/groups/isGroupsExport";
import { useApp } from "@/store/app/app";
import { useVk } from "@/store/vk/vk";
import { icons } from "@/common/consts";

useAppCaption("Настройки");

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

    const oldGroupsCount = useGroups().localGroupsArray.length;
    useGroups().saveImport(data);
    await useGroups().autoSaveCurrentLocalGroups();
    const newGroupsCount = useGroups().localGroupsArray.length;
    window.alert(
      `Импорт завершён данные. Новых групп: ${newGroupsCount - oldGroupsCount}.`
    );
  });

  reader.onload = onload;

  reader.readAsText(event.target.files[0]);
};

const onRemoveAllGroups = async () => {
  useGroups().removeLocalGroups();
  await useGroups().autoSaveCurrentLocalGroups();
};

const { Icon24CloudOutline } = icons;
</script>

<template>
  <APageContainer class="a-settings">
    <div class="a-button__left-content-block">
      <label class="a-checkbox-label">
        <input type="checkbox" v-model="useGroups().config.autoSave" />
        <span> Автосохранение групп </span>
        <br />
        <span class="a-mini-text">
          Запросы ограничены до тысячи в час; За этот сеанс вы уже сделали:
          {{ useVk().vkWebAppStorageSetCount }}. Если вы попытаетесь сохраниться
          при лимите - все группы будут утеряны!
          <br />
          Этот параметр не влияет на сохранение настроек. Они будут сохраняться
          автоматически в любом случае.
        </span>
      </label>
      <AButton
        class="a-button__left-content"
        style="font-weight: bold"
        :style="{ opacity: useGroups().config.autoSave ? 0 : 1 }"
        icon="Icon24MemoryCard"
        @click="useGroups().saveCurrentLocalGroups()"
      >
        <span>Сохранить группы</span>
      </AButton>
      <label class="a-checkbox-label">
        <input type="checkbox" v-model="useGroups().config.showCounters" />
        <span> Отображать счётчики количества фото\видео и так далее</span>
        <br />
        <span class="a-mini-text">Учтите, что придётся ждать их загрузку.</span>
      </label>
      <label class="a-checkbox-label">
        <input type="checkbox" v-model="useGroups().config.eruda" />
        <span> Включить дебаг кнопку (eruda)</span>
      </label>
    </div>
    <div class="a-button__left-content-block">
      <AButton class="a-button__left-content" icon="Icon24UploadOutline">
        <label>
          Добавить группы (импорт)
          <input
            style="display: none"
            type="file"
            accept=".json"
            @change="onImportFileChange"
          />
        </label>
      </AButton>
      <AButton
        class="a-button__left-content"
        icon="Icon24DownloadOutline"
        @click="useGroups().downloadExport()"
      >
        Скачать все группы (экспорт)
      </AButton>
      <AButton
        :disabled="useGroups().localGroupsArray.length === 0"
        class="a-button__left-content"
        icon="Icon24DeleteOutline"
        @click="onRemoveAllGroups"
      >
        Удалить все группы
      </AButton>
      <div
        class="a-rectangle-block"
        :data-color="useGroups().spaceUsed >= 80 ? 'red' : 'green'"
      >
        <span class="a-horizontal-center" style="gap: 5px">
          <Icon24CloudOutline />
          Занято места: {{ useGroups().spaceUsed }}%
        </span>
      </div>
    </div>
  </APageContainer>
</template>

<style lang="scss">
.a-settings {
  gap: 10px;
}
</style>
