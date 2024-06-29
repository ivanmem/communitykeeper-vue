<script lang="ts" setup>
import AButton from "@/components/AButton/AButton.vue";
import { useAppCaption } from "@/composables/useAppCaption";
import APageContainer from "@/components/APageContainer/APageContainer.vue";

useAppCaption("Ошибка");
</script>
<template>
  <APageContainer>
    <div>Данной страницы не существует.</div>
    <AButton to="/">Перейти к группам</AButton>
  </APageContainer>
</template>
