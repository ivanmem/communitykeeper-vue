import { MaybeRefOrGetter, toValue, watch } from "vue";
import { useApp } from "@/store/app/app";
import random from "lodash/random";

export function useScreenSpinner(
  loading: MaybeRefOrGetter<boolean>,
  id?: string | number,
) {
  id = id ?? random(true);
  const appStore = useApp();

  watch(
    () => toValue(loading),
    async (loading) => {
      if (loading) {
        appStore.loadingSet.add(id);
      } else {
        appStore.loadingSet.delete(id);
      }
    },
    { immediate: toValue(loading) },
  );
}
