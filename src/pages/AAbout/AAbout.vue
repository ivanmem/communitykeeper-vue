<script lang="ts" setup>
import AButton from "../../components/AButton/AButton.vue";
import APageContainer from "../../components/APageContainer/APageContainer.vue";
import { useAppCaption } from "../../hooks/useAppCaption";

useAppCaption("О приложении");
</script>

<template>
  <APageContainer class="a-about">
    <span>
      Это приложение с открытым исходным кодом.
      <br />Вы можете внести свой вклад. <br />Для этого вам необходимо изучить:
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
