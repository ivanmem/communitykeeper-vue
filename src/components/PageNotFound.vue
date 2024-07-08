<script lang="ts" setup>
import BaseButton from "@/components/BaseButton.vue";
import { useAppCaption } from "@/shared/composables/useAppCaption";
import PageContainer from "@/components/PageContainer.vue";

useAppCaption("Ошибка");
</script>
<template>
  <PageContainer>
    <div>Данной страницы не существует.</div>
    <BaseButton to="/">Перейти к группам</BaseButton>
  </PageContainer>
</template>
