<script lang="ts" setup>
import { useRoute } from "vue-router";
import copy from "copy-to-clipboard";
import AButton from "@/components/AButton/AButton.vue";
import { useColorScheme } from "@/composables/useColorScheme";
import { useApp } from "@/store/app/app";
import { darkColorScheme, icons } from "@/common/consts";
import { useGroups } from "@/store/groups/groups";
import { useVk } from "@/store/vk/vk";
import { onBeforeMount, ref, watch } from "vue";
import { switchFullscreen } from "@/helpers/switchFullscreen";
import { VDefaultsProvider, VToolbar } from "vuetify/components";
import ASpinner from "@/components/ASpinner.vue";
import ADynamicDialog from "@/components/ADynamicDialog.vue";

const route = useRoute();
const groupsStore = useGroups();
const vkStore = useVk();
const appStore = useApp();
const { currentClasses } = useColorScheme();
const fullscreenElement = ref(document.fullscreenElement);
const init = ref(false);
const vuetifyDefaults: VDefaultsProvider["defaults"] = {
  VLabel: {},
  VDialog: {
    closeOnBack: true,
    scrim: "black",
  },
  global: {
    clearable: true,
  },
};
const tabBarItems: Array<{
  caption: string;
  icon: any;
  to: string;
}> = [
  {
    caption: "Группы",
    icon: icons.Icon24ArticleBoxOutline,
    to: "/",
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
    caption: "О приложении",
    icon: icons.Icon24LightbulbStarOutline,
    to: "/about",
  },
];
const win = window;

const onKeyDown = (e: KeyboardEvent) => {
  if (e.code === "F11" && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
    e.preventDefault();
    e.stopPropagation();
    switchFullscreen();
  }
};

onBeforeMount(async () => {
  document.documentElement.addEventListener("fullscreenchange", () => {
    fullscreenElement.value = document.fullscreenElement;
  });
  try {
    await vkStore.init();
    await groupsStore.init();
  } finally {
    init.value = true;
  }
});

watch(fullscreenElement, () => {
  appStore.isFullScreen = !!fullscreenElement.value;
});

watch(
  () => appStore.platform,
  () => {
    document.body.dataset.platform = appStore.platform;
  },
  { immediate: true },
);
watch(
  () => vkStore.webAppConfig,
  () => {
    if (!vkStore.webAppConfig) {
      return;
    }

    document.body.dataset.app = vkStore.webAppConfig.app ? "true" : "false";
    if (vkStore.webAppConfig.insets) {
      const { top, left, right, bottom } = vkStore.webAppConfig.insets;
      document.body.style.padding = `${top}px ${right}px ${bottom}px ${left}px`;
    } else if (appStore.isAppIos) {
      document.body.style.paddingBottom = "8px";
    }
  },
  { immediate: true },
);

watch(
  () => vkStore.webAppConfig?.app,
  () => {
    const { platform } = appStore;
    const app = vkStore.webAppConfig?.app;
    const appHeight = platform === "ios" ? "18px" : "20px";
    const browserHeight = platform === "android" ? "20px" : "16px";
    document.body.style.setProperty(
      "--navigation-header-height",
      `calc(var(--vk-app-buttons-height) + ${app ? appHeight : browserHeight})`,
    );
  },
  { immediate: true },
);
</script>

<template>
  <VThemeProvider :theme="darkColorScheme ? 'dark' : 'light'">
    <VDefaultsProvider :defaults="vuetifyDefaults">
      <div
        :data-fullscreen="appStore.isFullScreen"
        :data-platform="appStore.platform"
        class="overflow-block app"
        tabindex="0"
        @keydown="onKeyDown"
      >
        <ASpinner v-show="!groupsStore.isInit || appStore.isLoading" />
        <template v-if="groupsStore.isInit">
          <v-toolbar
            class="navigation-header navigation-header-height navigation-header-padding-right"
            density="compact"
          >
            <v-toolbar-title style="flex-grow: 5">
              <div id="caption" class="overflow-block navigation-caption">
                {{ appStore.caption }}
              </div>
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <div id="navigation-header__right"></div>
            <VBtn
              v-if="route.path !== '/'"
              :icon="icons.Icon24Linked"
              variant="text"
              @click="copy('vk.com/app51658481#' + route.path)"
            />
            <VBtn
              v-if="useApp().isVkCom"
              :icon="
                fullscreenElement
                  ? icons.Icon24FullscreenExit
                  : icons.Icon24Fullscreen
              "
              variant="text"
              @click="switchFullscreen()"
            />
          </v-toolbar>
          <div class="overflow-block route-view">
            <router-view v-if="init" v-slot="{ Component }">
              <keep-alive :max="3" exclude="AAlbum">
                <component :is="Component" />
              </keep-alive>
            </router-view>
          </div>
          <VToolbar class="navigation" color="transparent" density="compact">
            <div class="navigation-bottom-buttons">
              <AButton
                v-for="item of tabBarItems"
                :hide-content="!appStore.isVkCom"
                :icon="item.icon"
                :to="item.to"
              >
                <span> {{ item.caption }} </span>
              </AButton>
            </div>
          </VToolbar>
          <ADynamicDialog />
        </template>
      </div>
    </VDefaultsProvider>
  </VThemeProvider>
</template>

<style lang="scss">
.app {
  gap: 10px;
}

.navigation-header {
  align-items: center;
  display: flex;
  gap: 5px;

  padding-inline: 10px;
}

.navigation-header-height {
  min-height: var(--navigation-header-height);

  .v-toolbar__content {
    min-height: inherit;
  }
}

.navigation-header-padding-right {
  padding-right: var(--navigation-header-padding-right, 10px);

  @at-root .root[data-fullscreen="true"] & {
    padding-right: 10px;
  }
}

#navigation-header__right {
  align-items: center;
  display: flex;
  gap: 5px;
}

.navigation {
  align-items: center;
  display: flex;
  padding-inline: 5px;
}

.navigation-caption {
  align-items: flex-start;
  display: flex;
  font-size: min(calc(0.3em + 2vw), 18px);
  font-weight: bold;
  justify-items: center;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  text-transform: uppercase;
  white-space: nowrap;

  a {
    color: inherit;
    font-size: inherit;
    font-weight: inherit;
    max-width: inherit;
    overflow: inherit;
    text-decoration: inherit;
    text-overflow: inherit;
    text-transform: inherit;
    white-space: inherit;
  }
}

.navigation-bottom-buttons {
  align-items: center;
  border-radius: 5px;
  display: flex;
  gap: 5px;
  min-width: 100%;
  overflow: auto;
  padding: 10px;

  & > * {
    flex-grow: 1;
  }

  @at-root .root:not([data-platform="vkcom"]) & {
    justify-content: space-around;
    align-content: space-around;
  }

  .a-button {
    min-height: 26px;
    white-space: nowrap;
  }
}
</style>
