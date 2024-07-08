import { onActivated, onDeactivated, ref } from "vue";

export function useActivated() {
  const isActive = ref(true);

  onActivated(() => {
    isActive.value = true;
  });

  onDeactivated(() => {
    isActive.value = false;
  });

  return isActive;
}
