<script lang="ts" setup>
import { useRoute } from "vue-router";
import copy from "copy-to-clipboard";
import AButton from "./components/AButton/AButton.vue";
import { useColorScheme } from "./useColorScheme";
import { useApp } from "./store/app/app";
import { icons } from "./common/consts";
import { useGroups } from "./store/groups/groups";
import { useVk } from "./store/vk/vk";
import Loading from "vue3-loading-overlay";

const route = useRoute();
const groupsStore = useGroups();
const vkStore = useVk();
const appStore = useApp();
const { currentClasses } = useColorScheme();
const { Icon24Linked } = icons;
(async () => {
  await vkStore.init();
  await groupsStore.init();
})();
</script>

<template>
  <Loading :active="appStore.isLoading" is-full-page />
  <div v-if="groupsStore.isInit" :class="currentClasses" class="root">
    <div class="navigation-header">
      <div class="overflow-block navigation-caption">
        {{ appStore.caption }}
      </div>
      <AButton
        v-if="route.path !== '/'"
        style="height: 30px"
        @click="copy('vk.com/app51658481#' + route.path)"
      >
        <Icon24Linked />
      </AButton>
    </div>
    <div class="route-view">
      <router-view v-slot="{ Component }">
        <Transition mode="out-in" name="fade">
          <component :is="Component" :key="route.fullPath" />
        </Transition>
      </router-view>
    </div>
    <div class="navigation">
      <div class="navigation-bottom-buttons">
        <AButton icon="Icon24ArticleBoxOutline" to="/">
          <span> Группы </span>
        </AButton>
        <AButton icon="Icon24AddSquareOutline" to="/add">
          <span> Добавить </span>
        </AButton>
        <AButton icon="Icon24GearOutline" to="/settings">
          <span> Настройки </span>
        </AButton>
        <AButton icon="Icon24LightbulbStarOutline" to="/about">
          <span> О приложении </span>
        </AButton>
      </div>
    </div>
  </div>
</template>

<style lang="scss" scoped>
@import "styles/helpers";
@import "styles/variables";

.root {
  padding-top: 2px;
  padding-block: 10px;
  gap: 10px;
  background: var(--vkui--color_background_content);
  @extend .overflow-block;
}

.route-view {
  @extend .overflow-block;
}

.navigation-header {
  display: flex;
  align-items: center;
  padding-inline: 10px;
  padding-right: var(--navigation-header-padding-right, 10px);
  min-height: 30px;
}

.navigation {
  display: flex;
  align-items: center;
  padding-inline: 10px;
}

.navigation-caption {
  display: flex;
  align-items: flex-start;
  justify-items: center;
  justify-content: center;
  font-weight: bold;
  text-transform: uppercase;
}

.navigation-bottom-buttons {
  display: flex;
  gap: 5px;
  align-items: center;
  overflow: auto;
  padding: 10px;
  background: var(--vkui--color_background);
  min-width: 100%;
  border-radius: 5px;

  .a-button {
    min-height: 26px;
    white-space: nowrap;
  }
}

.fade-enter-active,
.fade-leave-active {
  transition: opacity 0.2s linear;
}

.fade-enter,
.fade-leave-active {
  opacity: 0;
}
</style>
