<script lang="ts" setup>
import { useAppCaption } from "@/composables/useAppCaption";
import { icons, styledIcons } from "@/common/consts";

useAppCaption("Проект");
</script>

<template>
  <VCard class="overflow-block a-about">
    <VCardSubtitle style="margin-top: 10px">🤔 Описание</VCardSubtitle>
    <VCardItem>
      Это приложение позволяет вам группировать и сортировать группы, а так же
      быстро переходить к их фото\альбомам\видео\статьям. В приложении имеется
      встроенная галерея для просмотра фото в максимальном качестве и с
      возможностью листать фото нажатиями по краям, как в Telegram. В качестве
      бонуса - то что вы просматриваете сохраняется в историю, но она обнуляется
      при каждом обновлении приложения, так как ВК меняет домен при публикации.
    </VCardItem>
    <VDivider style="margin-bottom: 10px" />
    <VCardSubtitle>❗ Важное</VCardSubtitle>
    <VCardItem>
      Периодически делайте бэкап данных. Они хранятся в VK Storage
      (dev.vk.com/method/storage.set). Так как в этом хранилище ограничено
      количество символов на один ключ - данные делятся на части и сохраняются
      подобно разделённому архиву. Если ваши группы сохранятся не до конца - то
      приложение не сможет спарсить данные и они будут потеряны
      <b>навсегда</b>.
    </VCardItem>
    <VDivider style="margin-bottom: 10px" />
    <VCardSubtitle>🆓 Open Source</VCardSubtitle>
    <VCardItem>
      Это приложение с открытым исходным кодом. Вы можете внести свой вклад. Мы
      используем:
    </VCardItem>
    <VCardItem>
      <VCode>TypeScript, SCSS, Vite, Vue 3, Pinia, Vuetify</VCode>
    </VCardItem>
    <VDivider style="margin-bottom: 10px" />
    <VCardSubtitle>🤝 Обратная связь</VCardSubtitle>
    <VCardItem style="max-width: max-content">
      <VRow no-gutters style="gap: 10px">
        <VBtn
          :prepend-icon="icons.Icon16Users2Outline"
          color="light-blue-darken-4"
          href="https://vk.com/communitykeeper"
          target="_blank"
        >
          Сообщество
        </VBtn>
        <VBtn
          :prepend-icon="styledIcons.Icon16GitHub"
          color="light-blue-darken-4"
          href="https://github.com/ivanmem/local-vk-groups-catalog-vue"
          target="_blank"
        >
          Github
        </VBtn>
        <VBtn
          :prepend-icon="icons.Icon16MessageOutline"
          color="light-blue-darken-4"
          href="https://vk.me/join/zIMseEpegiHBPjZq3H2aIOUiBPQQpFWsGu0="
          target="_blank"
        >
          Чат
        </VBtn>
      </VRow>
    </VCardItem>
    <VDivider style="margin-bottom: 10px" />
    <VCardSubtitle>💡 Совет</VCardSubtitle>
    <VCardItem>Вы можете перейти в полноэкранный режим нажав F11.</VCardItem>
  </VCard>
</template>
<style lang="scss"></style>
