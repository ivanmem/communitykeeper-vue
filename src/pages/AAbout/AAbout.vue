<script lang="ts" setup>
import { useAppCaption } from "@/composables/useAppCaption";
import { icons } from "@/common/consts";

useAppCaption("О приложении");
</script>

<template>
  <VCard class="overflow-block a-about">
    <VCardItem>
      Это приложение отображает добавленные вами группы в едином списке и
      позволяет просматривать количество и в один клик переходить к
      фото\альбомам\видео\статьям.
    </VCardItem>
    <VCardItem> Вы можете перейти в полноэкранный режим нажав F11.</VCardItem>
    <VCardItem>
      Периодически делайте бэкап данных. Они хранятся в VK Storage
      (dev.vk.com/method/storage.set). Так как в этом хранилище ограничено
      количество символов на один ключ - данные делятся на части и сохраняются
      подобно разделённому архиву. Если ваши группы сохранятся не до конца - то
      приложение не сможет спарсить данные и они будут потеряны
      <b>навсегда</b>.
    </VCardItem>
    <VCardItem>
      Это приложение с открытым исходным кодом. Вы можете внести свой вклад. Мы
      используем:
    </VCardItem>
    <VCardItem>
      <VCode>TypeScript, SCSS, Vite, Vue 3, Pinia, Vuetify</VCode>
    </VCardItem>
    <VCardItem style="max-width: 400px">
      <VRow no-gutters style="gap: 10px">
        <VBtn
          :prepend-icon="icons.Icon16Link"
          class="a-button__left-content"
          href="https://github.com/xeleoss/local-vk-groups-catalog-vue"
          target="_blank"
          color="light-blue-darken-4"
        >
          Github
        </VBtn>
        <VBtn
          :prepend-icon="icons.Icon16Link"
          class="a-button__left-content"
          href="https://github.com/xeleoss/local-vk-groups-catalog-vue/commits/main"
          target="_blank"
          color="light-blue-darken-4"
        >
          Информация об обновлениях
        </VBtn>
        <VBtn
          :prepend-icon="icons.Icon16Link"
          class="a-button__left-content"
          href="https://github.com/xeleoss/local-vk-groups-catalog-vue/issues/new"
          target="_blank"
          color="light-blue-darken-4"
        >
          Задачи
        </VBtn>
      </VRow>
    </VCardItem>
  </VCard>
</template>
<style lang="scss"></style>
