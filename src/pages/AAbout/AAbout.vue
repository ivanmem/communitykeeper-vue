<script lang="ts" setup>
import AButton from "@/components/AButton/AButton.vue";
import APageContainer from "@/components/APageContainer/APageContainer.vue";
import { useAppCaption } from "@/hooks/useAppCaption";

useAppCaption("О приложении");
</script>

<template>
  <APageContainer class="a-about">
    <span
      >Это приложение отображает добавленные вами группы в едином списке и
      позволяет просматривать количество и в один клик переходить к
      фото\альбомам\видео\статьям.</span
    >
    <br />
    <span>
      Периодически делайте бэкап данных. Они хранятся в VK Storage
      (dev.vk.com/method/storage.set). Так как в этом хранилище ограничено
      количество символов на один ключ - данные делятся на части и сохраняются
      подобно разделённому архиву. Если ваши группы сохранятся не до конца - то
      приложение не сможет спарсить данные и они будут потеряны <b>навсегда</b>.
    </span>
    <br />
    <span>
      Это приложение с открытым исходным кодом.
      <br />Вы можете внести свой вклад.
      <br />
      Мы используем:
      <b>TypeScript, SCSS, Vite, Vue 3, Pinia</b>.
    </span>
    <div class="a-button__left-content-block">
      <AButton
        class="a-button__left-content"
        icon="Icon16Link"
        to="https://github.com/xeleoss/local-vk-groups-catalog-vue"
      >
        <span>Github</span>
      </AButton>
      <AButton
        class="a-button__left-content"
        icon="Icon16Link"
        to="https://github.com/xeleoss/local-vk-groups-catalog-vue/commits/main"
      >
        <span>Информация об обновлениях</span>
      </AButton>
      <AButton
        class="a-button__left-content"
        icon="Icon16Link"
        to="https://github.com/xeleoss/local-vk-groups-catalog-vue/issues/new"
      >
        <span>Нашли баг или хотите новую функцию?</span>
      </AButton>
    </div>
  </APageContainer>
</template>
<style lang="scss"></style>
