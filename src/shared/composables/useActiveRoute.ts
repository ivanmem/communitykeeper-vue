import { useRoute } from "vue-router";
import { computed } from "vue";
import { useActiveValue } from "@/shared/composables/useActiveValue";

/** @description Обновляет параметры роута только когда компонент активен */
export function useActiveRoute() {
  const route = useRoute();
  const computedRoute = computed(() => ({
    params: route.params,
    query: route.query,
  }));
  return useActiveValue(computedRoute);
}
