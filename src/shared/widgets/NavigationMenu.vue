<script lang="ts" setup>
import { useRoute } from "vue-router";
import BaseButton from "@/components/BaseButton";
import {
  Icon24ArticleBoxOutline,
  Icon24AddSquareOutline,
  Icon24HistoryBackwardOutline,
  Icon24GearOutline,
  Icon24LightbulbStarOutline,
} from "vue-vkontakte-icons";
import { useI18n } from "vue-i18n";

const { t } = useI18n({
  messages: {
    ru: {
      groups: "Группы",
      add: "Добавить",
      history: "История",
      settings: "Настройки",
      about: "Проект",
    },
    en: {
      groups: "Groups",
      add: "Add",
      history: "History",
      settings: "Settings",
      about: "About",
    },
  },
});

const route = useRoute();

const tabBarItems: Array<{
  captionKey: string;
  icon: any;
  to: string;
  getDataType?: () => "accent" | undefined;
}> = [
  {
    captionKey: "groups",
    icon: Icon24ArticleBoxOutline,
    to: "/",
    getDataType: () => {
      return route.path === "/" || route.path.startsWith("/album")
        ? "accent"
        : undefined;
    },
  },
  {
    captionKey: "add",
    icon: Icon24AddSquareOutline,
    to: "/add/",
  },
  {
    captionKey: "history",
    icon: Icon24HistoryBackwardOutline,
    to: "/history/",
  },
  {
    captionKey: "settings",
    icon: Icon24GearOutline,
    to: "/settings/",
  },
  {
    captionKey: "about",
    icon: Icon24LightbulbStarOutline,
    to: "/about/",
  },
];
</script>
<template>
  <div class="navigation">
    <div class="navigation-bottom-buttons">
      <BaseButton
        v-for="item of tabBarItems"
        :data-type="item.getDataType?.()"
        :icon="item.icon"
        :to="item.to"
      >
        <span> {{ t(item.captionKey) }} </span>
      </BaseButton>
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
      line-height: 125%;
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
