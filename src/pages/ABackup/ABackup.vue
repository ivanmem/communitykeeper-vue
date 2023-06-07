<script lang="ts" setup>
import APageContainer from "../../components/APageContainer/APageContainer.vue";
import { useAppCaption } from "../../hooks/useAppCaption";
import { useGroups } from "../../store/groups/groups";
import AButton from "../../components/AButton/AButton.vue";
import { isGroupsExport } from "../../store/groups/isGroupsExport";

useAppCaption("Бэкап");

const onImportFileChange = (event: any) => {
  if (!event.target?.files?.length) {
    return;
  }

  const reader = new FileReader();

  reader.onload = (e) => {
    const data = JSON.parse(e.target!.result as string);
    if (!isGroupsExport(data)) {
      window.alert("Некорректные данные.");
      return;
    }

    const oldGroupsCount = useGroups().localGroupsArray.length;
    useGroups().saveImport(data);
    useGroups().saveCurrentLocalGroups();
    const newGroupsCount = useGroups().localGroupsArray.length;
    window.alert(
      `Импорт завершён данные. Новых групп: ${newGroupsCount - oldGroupsCount}.`
    );
  };

  reader.readAsText(event.target.files[0]);
};

const onRemoveAllGroups = () => {
  useGroups().removeLocalGroups();
  useGroups().saveCurrentLocalGroups();
  window.alert("Все текущие группы удалены.");
};
</script>

<template>
  <APageContainer class="a-backup">
    <AButton class="a-backup__btn" icon="Icon24UploadOutline">
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
      class="a-backup__btn"
      icon="Icon24DownloadOutline"
      @click="useGroups().downloadExport()"
    >
      Скачать текущие группы
    </AButton>
    <AButton
      class="a-backup__btn"
      icon="Icon24DeleteOutline"
      @click="onRemoveAllGroups"
    >
      Удалить все текущие группы
    </AButton>
  </APageContainer>
</template>

<style lang="scss">
.a-backup {
  .a-backup__btn {
    width: 250px;
    justify-content: left;
  }
}
</style>
