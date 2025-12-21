<script lang="ts" setup>
import BaseButton from "@/components/BaseButton";
import { useAppCaption } from "@/shared/composables/useAppCaption";
import PageContainer from "@/components/PageContainer";
import { useI18n } from "vue-i18n";

const { t } = useI18n({
  messages: {
    ru: {
      error: "Ошибка",
      pageNotFound: "Данной страницы не существует.",
      goToGroups: "Перейти к группам",
    },
    en: {
      error: "Error",
      pageNotFound: "This page does not exist.",
      goToGroups: "Go to groups",
    },
  },
});

useAppCaption(t("error"));
</script>
<template>
  <PageContainer>
    <div>{{ t("pageNotFound") }}</div>
    <BaseButton :to="{ name: 'groups' }">{{ t("goToGroups") }}</BaseButton>
  </PageContainer>
</template>
