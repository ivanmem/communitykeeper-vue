<script lang="ts" setup>
import { ref } from "vue";
import { isDisabledCookies } from "@/shared/helpers/isDisabledCookies";
import { useI18n } from "vue-i18n";

const { t } = useI18n({
  messages: {
    ru: {
      cookiesDisabled: "В Вашем браузере отключены cookie.",
      cookiesNeeded: "Они нужны для кэширования:",
      filters: "1) Фильтров",
      counters: "2) Счётчиков групп",
      history: "3) Истории просмотров",
    },
    en: {
      cookiesDisabled: "Cookies are disabled in your browser.",
      cookiesNeeded: "They are needed for caching:",
      filters: "1) Filters",
      counters: "2) Group counters",
      history: "3) View history",
    },
  },
});

const isDisabledCookiesAlert = ref(isDisabledCookies());
</script>
<template>
  <VCardItem v-if="isDisabledCookiesAlert" style="max-width: 400px">
    <VAlert
      :closable="true"
      color="deep-orange-darken-4"
      density="compact"
      type="warning"
      @click:close="isDisabledCookiesAlert = false"
    >
      <template #text>
        <a
          href="https://support.google.com/accounts/answer/61416"
          style="text-decoration: underline"
          target="_blank"
        >
          {{ t("cookiesDisabled") }}
        </a>
        <br />
        {{ t("cookiesNeeded") }}
        <br />
        {{ t("filters") }}
        <br />
        {{ t("counters") }}
        <br />
        {{ t("history") }}
      </template>
    </VAlert>
  </VCardItem>
</template>
