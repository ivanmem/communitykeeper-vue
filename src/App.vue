<script lang="ts" setup>
import { useRoute } from "vue-router";
import copy from "copy-to-clipboard";
import AButton from "@/components/AButton/AButton.vue";
import { useColorScheme } from "@/useColorScheme";
import { useApp } from "@/store/app/app";
import { darkColorScheme, icons } from "@/common/consts";
import { useGroups } from "@/store/groups/groups";
import { useVk } from "@/store/vk/vk";
import Loading from "vue3-loading-overlay";
import { onBeforeMount, onMounted, ref, watch } from "vue";
import { switchFullscreen } from "@/helpers/switchFullscreen";
import { VDefaultsProvider } from "vuetify/components";

const route = useRoute();
const groupsStore = useGroups();
const vkStore = useVk();
const appStore = useApp();
const { currentClasses } = useColorScheme();

const fullscreenElement = ref(document.fullscreenElement);

watch(fullscreenElement, () => {
  appStore.isFullScreen = !!fullscreenElement.value;
});

const onKeyDown = (e: KeyboardEvent) => {
  if (e.code === "F11" && !e.ctrlKey && !e.metaKey && !e.shiftKey) {
    e.preventDefault();
    e.stopPropagation();
    switchFullscreen();
  }
};

const init = ref(false);

onBeforeMount(async () => {
  try {
    await vkStore.init();
    await groupsStore.init();
  } finally {
    init.value = true;
  }
});

onMounted(() => {
  document.documentElement.addEventListener("fullscreenchange", () => {
    fullscreenElement.value = document.fullscreenElement;
  });
});

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
</script>

<template>
  <VThemeProvider :theme="darkColorScheme ? 'dark' : 'light'">
    <VDefaultsProvider :defaults="vuetifyDefaults">
      <div
        :class="currentClasses"
        :data-dark="darkColorScheme"
        :data-fullscreen="appStore.isFullScreen"
        :data-platform="appStore.platform"
        class="overflow-block root"
        tabindex="0"
        @keydown="onKeyDown"
      >
        <Loading
          :active="!groupsStore.isInit || appStore.isLoading"
          :opacity="0.3"
          background-color="#000"
          color="#eee"
          is-full-page
          lock-scroll
        />
        <template v-if="groupsStore.isInit">
          <v-toolbar density="compact" class="navigation-header">
            <v-toolbar-title style="flex-grow: 5">
              <div id="caption" class="overflow-block navigation-caption">
                {{ appStore.caption }}
              </div>
            </v-toolbar-title>
            <v-spacer></v-spacer>
            <div id="navigation-header__right"></div>
            <VBtn
              v-if="route.path !== '/'"
              variant="text"
              :icon="icons.Icon24Linked"
              @click="copy('vk.com/app51658481#' + route.path)"
            />
            <VBtn
              v-if="useApp().isVkCom"
              variant="text"
              :icon="
                fullscreenElement
                  ? icons.Icon24FullscreenExit
                  : icons.Icon24Fullscreen
              "
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
          <VToolbar density="compact" class="navigation" color="transparent">
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
        </template>
      </div>
    </VDefaultsProvider>
  </VThemeProvider>
</template>

<style lang="scss">
.root {
  gap: 10px;
  background: var(--vkui--color_background_content);
}

.route-view {
}

.navigation-header {
  display: flex;
  align-items: center;
  padding-inline: 10px;
  padding-right: var(--navigation-header-padding-right, 10px);
  min-height: 30px;
  gap: 5px;

  @at-root .root[data-fullscreen="true"] & {
    padding-right: 10px;
  }
}

#navigation-header__right {
  display: flex;
  align-items: center;
  gap: 5px;
}

.navigation {
  display: flex;
  align-items: center;
  padding-inline: 5px;
}

.navigation-caption {
  display: flex;
  align-items: flex-start;
  justify-items: center;
  justify-content: center;
  font-weight: bold;
  text-transform: uppercase;
  font-size: min(calc(0.3em + 2vw), 18px);
  text-overflow: ellipsis;
  white-space: nowrap;
  overflow: hidden;
  max-width: 100%;

  a {
    color: inherit;
    font-weight: inherit;
    font-size: inherit;
    text-transform: inherit;
    text-decoration: inherit;
    text-overflow: inherit;
    white-space: inherit;
    overflow: inherit;
    max-width: inherit;
  }
}

.navigation-bottom-buttons {
  display: flex;
  gap: 5px;
  align-items: center;
  overflow: auto;
  padding: 10px;
  min-width: 100%;
  border-radius: 5px;

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
