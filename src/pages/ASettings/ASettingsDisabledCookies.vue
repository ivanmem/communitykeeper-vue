<script lang="ts" setup>
import { ref } from "vue";
import { getPiniaPersist } from "@/helpers/getPiniaPersist";

const isDisabledCookies = ref(!getPiniaPersist(true));
</script>
<template>
  <VCardItem v-if="isDisabledCookies" style="max-width: 400px">
    <VAlert
      :closable="true"
      color="deep-orange-darken-4"
      density="compact"
      type="warning"
      @click:close="isDisabledCookies = false"
    >
      <template #text>
        <a
          href="https://support.google.com/accounts/answer/61416"
          style="text-decoration: underline"
          target="_blank"
        >
          В вашем браузере отключены cookie.
        </a>
        <br />
        Они нужны для кэширования:
        <br />
        1) Фильтров
        <br />
        2) Счётчиков групп
        <br />
        3) Истории просмотров
      </template>
    </VAlert>
  </VCardItem>
</template>
