<script lang="ts" setup>
import { useAppCaption } from "@/shared/composables/useAppCaption";
import {
  buildDateLocaleString,
  styledIcons,
  VK_STORAGE,
} from "@/shared/constants/consts";
import { Icon16Users2Outline, Icon16MessageOutline } from "vue-vkontakte-icons";
import { useI18n } from "vue-i18n";
import { computed } from "vue";

const { t } = useI18n({
  messages: {
    ru: {
      title: "Проект",
      description: "🤔 Описание",
      descriptionText:
        "Приложение позволяет группировать, фильтровать и сортировать группы, а также быстро переходить к их фото/альбомам/видео/статьям. Встроенная галерея позволяет смотреть фото в максимальном качестве и листать фото нажатиями по краям, как в Telegram. Просматриваемый контент сохраняется в историю.",
      lastUpdate: "Последнее обновление приложения",
      importantTip: "❗ Важный совет",
      importantTipText:
        'Периодически создавайте резервную копию во вкладке "Добавить". Ваши данные хранятся в VK Storage (dev.vk.com/method/storage.set). Так как в этом хранилище ограничено количество символов на один ключ ({chunkMaxSize}) - данные делятся на части и сохраняются подобно разделённому архиву (сейчас максимум на {chunksMaxCount} частей). Если Ваши группы сохранятся не до конца - то приложение не сможет спарсить данные и они будут повреждены.',
      feedback: "🤝 Обратная связь",
      community: "Сообщество",
      chat: "Чат",
      openSource: "🆓 Open Source",
      openSourceText:
        "Это приложение с открытым исходным кодом. Вы можете внести свой вклад. Мы используем:",
    },
    en: {
      title: "About",
      description: "🤔 Description",
      descriptionText:
        "The app allows you to group, filter and sort communities, as well as quickly navigate to their photos/albums/videos/articles. The built-in gallery allows you to view photos in maximum quality and swipe through photos by tapping on the edges, like in Telegram. Viewed content is saved to history.",
      lastUpdate: "Last app update",
      importantTip: "❗ Important tip",
      importantTipText:
        'Periodically create a backup in the "Add" tab. Your data is stored in VK Storage (dev.vk.com/method/storage.set). Since this storage has a limited number of characters per key ({chunkMaxSize}) - data is split into parts and saved like a split archive (currently max {chunksMaxCount} parts). If your groups are not fully saved - the app will not be able to parse the data and they will be corrupted.',
      feedback: "🤝 Feedback",
      community: "Community",
      chat: "Chat",
      openSource: "🆓 Open Source",
      openSourceText:
        "This is an open source application. You can contribute. We use:",
    },
  },
});

useAppCaption(computed(() => t("title")));
</script>

<template>
  <VCard class="overflow-block a-about">
    <VCardSubtitle style="padding-top: 12px">{{ t("description") }}</VCardSubtitle>
    <VCardItem>
      {{ t("descriptionText") }} <br /><br />
      {{ t("lastUpdate") }}: <b>{{ buildDateLocaleString }}</b
      >.
    </VCardItem>
    <VDivider style="margin-bottom: 10px" />
    <VCardSubtitle>{{ t("importantTip") }}</VCardSubtitle>
    <VCardItem>
      {{
        t("importantTipText", {
          chunkMaxSize: VK_STORAGE.chunkMaxSize,
          chunksMaxCount: VK_STORAGE.chunksMaxCount,
        })
      }}
    </VCardItem>
    <VDivider style="margin-bottom: 10px" />
    <VCardSubtitle>{{ t("feedback") }}</VCardSubtitle>
    <VCardItem style="max-width: max-content">
      <VRow no-gutters style="gap: 10px">
        <VBtn
          :prepend-icon="Icon16Users2Outline"
          color="light-blue-darken-4"
          href="https://vk.com/communitykeeper"
          target="_blank"
        >
          {{ t("community") }}
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
          {{ t("chat") }}
        </VBtn>
      </VRow>
    </VCardItem>
    <VDivider style="margin-bottom: 10px" />
    <VCardSubtitle>{{ t("openSource") }}</VCardSubtitle>
    <VCardItem>
      {{ t("openSourceText") }}
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
