import { onMounted, onUnmounted, ref } from "vue";

export function useUnmounted() {
  const value = ref(false);

  onMounted(() => {
    value.value = false;
  });

  onUnmounted(() => {
    value.value = true;
  });

  return value;
}
