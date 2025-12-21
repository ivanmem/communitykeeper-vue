import bridge, {
  AnyReceiveMethodName,
  AppearanceType,
  VKBridgeEvent,
} from "@vkontakte/vk-bridge";
import { Platform, platform } from "@vkontakte/vkui";
import { computed, ref, watch } from "vue";
import {
  resolveAppearance,
  VKBridgeConfigData,
} from "@vkontakte/vkui/dist/helpers/appearance";
import { generateVKUITokensClassName } from "@vkontakte/vkui/dist/helpers/generateVKUITokensClassName";
import { darkColorScheme } from "@/shared/constants/consts";

export type ThemeSetting = "system" | "light" | "dark";

const systemAppearance = ref<AppearanceType>("dark");
const themeSetting = ref<ThemeSetting>("system");

const effectiveAppearance = computed<AppearanceType>(() =>
  themeSetting.value === "system" ? systemAppearance.value : themeSetting.value,
);

/**
 * Применяет тему. Вызывается из app store после загрузки конфига.
 */
export function applyTheme(theme: ThemeSetting) {
  themeSetting.value = theme;
}

export function useColorScheme() {
  const currentClasses = ref("");
  const currentPlatform = platform();
  const mediaQuery =
    window &&
    window.matchMedia &&
    window.matchMedia("(prefers-color-scheme: dark)");
  if (mediaQuery.matches) {
    document!.documentElement.style.setProperty("color-scheme", "dark");
    currentClasses.value = generateVKUITokensClassName(currentPlatform, "dark");
    darkColorScheme.value = true;
  }

  if (currentPlatform !== Platform.VKCOM) {
    document.documentElement.style.setProperty(
      "--navigation-header-padding-right",
      "100px",
    );
  }

  bridge.subscribe(bridgeListener);

  watch(
    effectiveAppearance,
    (appearance) => {
      currentClasses.value = generateVKUITokensClassName(
        currentPlatform,
        appearance,
      );
      document!.documentElement.style.setProperty("color-scheme", appearance);
      darkColorScheme.value = appearance === "dark";
    },
    { immediate: true },
  );

  watch(
    currentClasses,
    () => {
      document.body.className = "root " + currentClasses.value;
    },
    { immediate: true },
  );

  watch(
    darkColorScheme,
    () => {
      document.body.dataset.dark = String(darkColorScheme.value);
    },
    { immediate: true },
  );

  function bridgeListener(e: VKBridgeEvent<AnyReceiveMethodName>) {
    const { type, data } = e.detail;
    if (type !== "VKWebAppUpdateConfig") {
      return;
    }

    const resolved = resolveAppearance(data as VKBridgeConfigData);
    if (resolved) {
      systemAppearance.value = resolved;
    }
  }

  return {
    currentClasses,
    currentPlatform,
  };
}
