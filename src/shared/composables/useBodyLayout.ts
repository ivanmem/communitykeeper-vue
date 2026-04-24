import { watch } from "vue";
import { useApp } from "@/store/app/app";
import { useVk } from "@/store/vk/vk";

export function useBodyLayout() {
  const appStore = useApp();
  const vkStore = useVk();

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
}
