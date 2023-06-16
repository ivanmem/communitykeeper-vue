<script lang="ts" setup>
import APageContainer from "@/components/APageContainer/APageContainer.vue";
import { useAppCaption } from "@/hooks/useAppCaption";
import { useGroups } from "@/store/groups/groups";
import AButton from "@/components/AButton/AButton.vue";
import { isGroupsExport } from "@/store/groups/isGroupsExport";
import { useApp } from "@/store/app/app";

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
</script>

<template>
  <APageContainer class="a-settings">
    <label style="user-select: none">
      <input type="checkbox" v-model="useGroups().config.autoSave" />
      <span>
        Автосохранение (осторожно, можно наткнуться на лимит запросов)
      </span>
    </label>
    <template v-if="!useGroups().config.autoSave">
      <AButton
        class="a-settings__btn"
        style="font-weight: bold"
        icon="Icon24MemoryCard"
        @click="useGroups().saveCurrentLocalGroups()"
      >
        <span>Сохранить изменения</span>
      </AButton>
    </template>
    <AButton class="a-settings__btn" icon="Icon24UploadOutline">
      <label>
        Добавить новые группы
        <input
          style="display: none"
          type="file"
          accept=".json"
          @change="onImportFileChange"
        />
      </label>
    </AButton>

    <AButton
      class="a-settings__btn"
      icon="Icon24DownloadOutline"
      @click="useGroups().downloadExport()"
    >
      Скачать текущие группы
    </AButton>
    <AButton
      :disabled="useGroups().localGroupsArray.length === 0"
      class="a-settings__btn"
      icon="Icon24DeleteOutline"
      @click="onRemoveAllGroups"
    >
      Удалить все текущие группы
    </AButton>
    <div>Занято места: {{ useGroups().spaceUsed }}%</div>
  </APageContainer>
</template>

<style lang="scss">
.a-settings {
  gap: 10px;
}

.a-settings__btn {
  width: 250px;
  justify-content: left;
}
</style>
