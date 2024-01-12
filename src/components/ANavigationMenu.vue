<script lang="ts" setup>
import { useRoute } from "vue-router";
import { icons } from "@/common/consts";
import AButton from "./AButton/AButton.vue";

const route = useRoute();

const tabBarItems: Array<{
  caption: string;
  icon: any;
  to: string;
  getDataType?: () => "accent" | undefined;
}> = [
  {
    caption: "Группы",
    icon: icons.Icon24ArticleBoxOutline,
    to: "/",
    getDataType: () => {
      return route.path === "/" || route.path.startsWith("/album")
        ? "accent"
        : undefined;
    },
  },
  {
    caption: "Добавить",
    icon: icons.Icon24AddSquareOutline,
    to: "/add",
  },
  {
    caption: "История",
    icon: icons.Icon24HistoryBackwardOutline,
    to: "/history",
  },
  {
    caption: "Настройки",
    icon: icons.Icon24GearOutline,
    to: "/settings",
  },
  {
    caption: "Проект",
    icon: icons.Icon24LightbulbStarOutline,
    to: "/about",
  },
];
</script>
<template>
  <div class="navigation">
    <div class="navigation-bottom-buttons">
      <AButton
        v-for="item of tabBarItems"
        :data-type="item.getDataType?.()"
        :icon="item.icon"
        :to="item.to"
      >
        <span> {{ item.caption }} </span>
      </AButton>
    </div>
  </div>
</template>
<style lang="scss">
.navigation {
  align-items: center;
  display: flex;
}

.navigation-bottom-buttons {
  align-content: space-around;
  align-items: center;
  background: var(--navigation-bottom-background);
  box-shadow:
    0 0 2px rgba(0, 0, 0, 0.08),
    0 4px 16px rgba(0, 0, 0, 0.08);
  box-shadow: var(--vkui--elevation3);
  display: flex;
  justify-content: space-around;
  min-width: 100%;
  overflow: auto;

  .a-button {
    background-color: transparent;
    color: var(--navigation-bottom-color);
    flex-basis: 0;
    flex-direction: column;
    flex-grow: 1;
    flex-shrink: 0;
    gap: 2px;
    height: var(--vkui_internal--tabbar_height);
    justify-content: center;
    max-width: 100%;
    min-width: 0;
    outline: none;
    padding: 4px 2px 2px;
    position: relative;
    text-decoration: none;

    span {
      display: block;
      font-family:
        -apple-system,
        system-ui,
        Helvetica Neue,
        Roboto,
        sans-serif;
      font-family: var(--vkui--font_footnote--font_family--regular);
      font-size: 10px;
      font-weight: var(--vkui--font_weight_accent2);
      line-height: 100%;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    @at-root .root[data-platform="vkcom"] & {
      flex-direction: row;
      gap: 8px;

      span {
        font-size: 14px;
      }
    }

    &[data-type="accent"] {
      color: var(--vkui--color_text_accent_themed);
    }

    .a-button__icon {
      height: 28px;
      margin: 0;
      width: 28px;
    }
  }
}
</style>
