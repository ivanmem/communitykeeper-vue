<script lang="ts" setup>
import BaseButton from "@/components/BaseButton";
import { useAppCaption } from "@/shared/composables/useAppCaption";
import PageContainer from "@/components/PageContainer";

useAppCaption("Ошибка");
</script>
<template>
  <PageContainer>
    <div>Данной страницы не существует.</div>
    <BaseButton :to="{ name: 'groups' }">Перейти к группам</BaseButton>
  </PageContainer>
</template>
