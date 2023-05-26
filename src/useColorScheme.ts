import bridge, {
  AnyReceiveMethodName,
  AppearanceType,
  VKBridgeEvent,
} from "@vkontakte/vk-bridge";
import { Platform, platform } from "@vkontakte/vkui";
import { ref } from "vue";
import {
  resolveAppearance,
  VKBridgeConfigData,
} from "@vkontakte/vkui/dist/helpers/appearance";
import { generateVKUITokensClassName } from "@vkontakte/vkui/dist/helpers/generateVKUITokensClassName";
import { darkColorScheme } from "./common/consts";

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

  let initialAppearance: AppearanceType | null = null;
  if (currentPlatform !== Platform.VKCOM) {
    document.documentElement.style.setProperty(
      "--navigation-header-padding-right",
      "100px"
    );
  }

  function bridgeListener(e: VKBridgeEvent<AnyReceiveMethodName>) {
    const { type, data } = e.detail;

    if (type !== "VKWebAppUpdateConfig") {
      return;
    }

    initialAppearance = resolveAppearance(data as VKBridgeConfigData);

    if (initialAppearance) {
      currentClasses.value = generateVKUITokensClassName(
        currentPlatform,
        initialAppearance
      );
      document!.documentElement.style.setProperty(
        "color-scheme",
        initialAppearance
      );
      darkColorScheme.value = initialAppearance === "dark";
    }
  }

  bridge.subscribe(bridgeListener);

  return {
    currentClasses,
    currentPlatform,
  };
}
