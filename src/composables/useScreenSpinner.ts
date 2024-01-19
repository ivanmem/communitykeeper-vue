import { computed, MaybeRefOrGetter, toRef, toValue, watch } from "vue";
import { useApp } from "@/store/app/app";
import { useActivated } from "@/composables/useActivated";

export function useScreenSpinner(
  loading: MaybeRefOrGetter<boolean>,
  id?: string | number,
) {
  id = id ?? Math.random();
  const appStore = useApp();
  const isActivated = useActivated();
  const finallyLoading = computed(() => isActivated.value && toValue(loading));

  watch(
    finallyLoading,
    async (finallyLoading) => {
      if (finallyLoading) {
        appStore.loadingSet.add(id);
      } else {
        appStore.loadingSet.delete(id);
      }
    },
    { immediate: finallyLoading.value },
  );
}
