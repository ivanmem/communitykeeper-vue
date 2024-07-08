import { useActivated } from "@/shared/composables/useActivated";
import { computed, MaybeRefOrGetter, nextTick, shallowRef, toValue, watch } from "vue";

/** @description Обновляет значение только когда компонент активен */
export function useActiveValue<T>(value: MaybeRefOrGetter<T>) {
  const isActive = useActivated();
  const computedValue = computed<T>(() => toValue(value));
  const freezeValue = shallowRef<T>(computedValue.value);

  watch([computedValue, isActive], async () => {
    await nextTick();
    if (isActive.value) {
      freezeValue.value = computedValue.value;
    }
  });

  return freezeValue;
}
