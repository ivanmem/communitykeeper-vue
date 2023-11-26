import { MaybeRefOrGetter, toValue, watch } from "vue";
import { useApp } from "@/store/app/app";
import random from "lodash/random";

export function useScreenSpinner(loading: MaybeRefOrGetter<boolean>) {
  const id = random(true);
  watch(
    () => toValue(loading),
    (loading) => {
      if (!loading) {
        useApp().loadingSet.delete(id);
      } else {
        useApp().loadingSet.add(id);
      }
    },
    { immediate: true },
  );
}
