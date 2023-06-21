import { useApp } from "@/store/app/app";
import { MaybeRefOrGetter, onActivated, toValue, watch } from "vue";

export function useAppCaption(newCaption: MaybeRefOrGetter<string>) {
  const appState = useApp();
  const setCaption = () => {
    appState.caption = toValue(newCaption);
  };
  onActivated(() => {
    setCaption();
  });
  watch(
    () => toValue(newCaption),
    () => {
      setCaption();
    },
    { immediate: true }
  );
}
