<script lang="ts" setup>
import { useAppCaption } from "@/shared/composables/useAppCaption";
import {
  buildDateLocaleString,
  styledIcons,
  VK_STORAGE,
} from "@/shared/constants/consts";
import { Icon16Users2Outline, Icon16MessageOutline } from "vue-vkontakte-icons";

useAppCaption(`Проект`);
</script>

<template>
  <VCard class="overflow-block a-about">
    <VCardSubtitle style="padding-top: 12px">🤔 Описание</VCardSubtitle>
    <VCardItem>
      Приложение позволяет группировать, фильтровать и сортировать группы, а
      также быстро переходить к их фото\альбомам\видео\статьям. Встроенная
      галерея позволяет смотреть фото в максимальном качестве и листать фото
      нажатиями по краям, как в Telegram. Просматриваемый контент сохраняется в
      историю. <br /><br />
      Последнее обновление приложения: <b>{{ buildDateLocaleString }}</b
      >.
    </VCardItem>
    <VDivider style="margin-bottom: 10px" />
    <VCardSubtitle>❗ Важный совет</VCardSubtitle>
    <VCardItem>
      Периодически создавайте резервную копию во вкладке "Добавить". Ваши данные
      хранятся в VK Storage (dev.vk.com/method/storage.set). Так как в этом
      хранилище ограничено количество символов на один ключ ({{
        VK_STORAGE.chunkMaxSize
      }}) - данные делятся на части и сохраняются подобно разделённому архиву
      (сейчас максимум на {{ VK_STORAGE.chunksMaxCount }} частей). Если Ваши
      группы сохранятся не до конца - то приложение не сможет спарсить данные и
      они будут <b>повреждены</b>.
    </VCardItem>
    <VDivider style="margin-bottom: 10px" />
    <VCardSubtitle>🤝 Обратная связь</VCardSubtitle>
    <VCardItem style="max-width: max-content">
      <VRow no-gutters style="gap: 10px">
        <VBtn
          :prepend-icon="Icon16Users2Outline"
          color="light-blue-darken-4"
          href="https://vk.com/communitykeeper"
          target="_blank"
        >
          Сообщество
        </VBtn>
        <VBtn
          :prepend-icon="styledIcons.Icon16GitHub"
          color="light-blue-darken-4"
          href="https://github.com/ivanmem/communitykeeper-vue"
          target="_blank"
        >
          Github
        </VBtn>
        <VBtn
          :prepend-icon="Icon16MessageOutline"
          color="light-blue-darken-4"
          href="https://vk.me/join/m50C8H_wh9ioCs9_JbRkbO_zVVTcea86D6M="
          target="_blank"
        >
          Чат
        </VBtn>
      </VRow>
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
  </VCard>
</template>
<style lang="scss">
.a-about {
}
</style>
