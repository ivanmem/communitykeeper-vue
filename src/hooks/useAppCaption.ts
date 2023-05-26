import { useApp } from "../store/app/app";
import { watch } from "vue";
import { get, MaybeRef } from "@vueuse/core";

export function useAppCaption(newCaption: MaybeRef<string>) {
  const appState = useApp();
  watch(
    () => get(newCaption),
    () => {
      appState.caption = get(newCaption);
    },
    { immediate: true }
  );
}
