<script lang="ts" setup>
import AButton from "@/components/AButton/AButton.vue";
import APageContainer from "@/components/APageContainer/APageContainer.vue";
import { useAppCaption } from "@/hooks/useAppCaption";

useAppCaption("О приложении");
</script>

<template>
  <APageContainer class="a-about">
    <span>
      Переодически делайте бэкап данных. Они хранятся в VK Storage
      (dev.vk.com/method/storage.set). Так как в этом хранилище ограничено
      количество символов на один ключ - данные делятся на части и сохраняются
      подобно разделённому архиву. Если ваши группы сохранятся не до конца - то
      приложение не сможет спарсить данные и они будут потеряны <b>навсегда</b>.
      Так же ВК хранит данные <b>1 год</b> после сохранения, поэтому не
      забывайте <b>сохраняться хотя бы раз в год</b>.
    </span>
    <br />
    <span>
      Это приложение с открытым исходным кодом.
      <br />Вы можете внести свой вклад.
      <br />
      Для этого вам необходимо изучить:
      <b>TypeScript, SCSS, Vite, Vue 3, Pinia</b>.
    </span>
    <AButton
      icon="Icon16Link"
      to="https://github.com/xeleoss/local-vk-groups-catalog-vue"
    >
      <span>Github</span>
    </AButton>
  </APageContainer>
</template>
<style lang="scss"></style>
