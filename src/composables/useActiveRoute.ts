import { useRoute } from "vue-router";
import { useActivated } from "@/composables/useActivated";
import { computed, nextTick, ref, watch } from "vue";

/** @description Обновляет параметры роута только когда компонент активен */
export function useActiveRoute() {
  const route = useRoute();
  const isActive = useActivated();
  const computedRoute = computed(() => ({
    params: route.params,
    query: route.query,
  }));
  const freezeRoute = ref(computedRoute.value);

  watch([computedRoute, isActive], async () => {
    await nextTick();
    if (isActive.value) {
      freezeRoute.value = computedRoute.value;
    }
  });

  return freezeRoute;
}
