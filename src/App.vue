<script lang="ts" setup>
import { useRoute } from "vue-router";
import { useColorScheme } from "@/shared/composables/useColorScheme";
import { useApp } from "@/store/app/app";
import { darkColorScheme, icons } from "@/shared/constants/consts";
import { useGroups } from "@/store/groups/groups";
import { useVk } from "@/store/vk/vk";
import { onBeforeMount, ref, shallowRef, watch } from "vue";
import { switchFullscreen } from "@/shared/helpers/switchFullscreen";
import { VDefaultsProvider, VToolbar } from "vuetify/components";
import BaseSpinner from "@/components/BaseSpinner";
import DynamicDialog from "@/shared/widgets/DynamicDialog.vue";
import NavigationMenu from "@/shared/widgets/NavigationMenu.vue";
import { useUnmounted } from "@/shared/composables/useUnmounted";
import SingleLineDynamicFont from "@/components/SingleLineDynamicFont/SingleLineDynamicFont.vue";

const route = useRoute();
const groupsStore = useGroups();
const vkStore = useVk();
const appStore = useApp();
const vkService = useVk();
let unmounted = useUnmounted();
useColorScheme();
const fullscreenElement = ref(document.fullscreenElement);
const init = ref(false);
const vuetifyDefaults: VDefaultsProvider["defaults"] = {
  VLabel: {},
  VDialog: {
    closeOnBack: true,
    scrim: "black",
  },
  VSwitch: {
    color: "primary",
  },
  global: {
    clearable: true,
  },
};

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
    await appStore.init({ unmounted });
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

const LinkIcon = shallowRef(icons.Icon24Linked);

watch(
  () => route.path,
  () => {
    LinkIcon.value = icons.Icon24Linked;
  },
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
        <BaseSpinner v-show="!groupsStore.isInit || appStore.isLoading" />
        <template v-if="groupsStore.isInit">
          <VToolbar
            class="navigation-header navigation-header-height navigation-header-padding-right"
            density="compact"
          >
            <VToolbarTitle style="flex-grow: 5">
              <SingleLineDynamicFont
                id="caption"
                class="overflow-block navigation-caption"
              >
                {{ appStore.caption }}
              </SingleLineDynamicFont>
            </VToolbarTitle>
            <VSpacer></VSpacer>
            <div id="navigation-header__right"></div>
            <VBtn
              v-if="route.path !== '/'"
              :icon="LinkIcon"
              title="Скопировать текущую ссылку"
              variant="text"
              @click="
                vkService.copyText(`vk.com/app${appStore.appId}#` + route.path);
                LinkIcon = icons.Icon24CopyOutline;
              "
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
          </VToolbar>
          <div class="overflow-block route-view">
            <RouterView v-if="init" v-slot="{ Component }">
              <KeepAlive :max="3" exclude="AAlbum">
                <component :is="Component" />
              </KeepAlive>
            </RouterView>
          </div>

          <NavigationMenu />
          <DynamicDialog />
        </template>
      </div>
    </VDefaultsProvider>
  </VThemeProvider>
</template>

<style lang="scss">
.app {
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

    & > .v-toolbar-title {
      margin-inline-start: 6px;
    }
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
</style>
