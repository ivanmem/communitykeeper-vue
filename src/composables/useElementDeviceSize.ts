import {
  ElementSize,
  MaybeComputedElementRef,
  MaybeElement,
  useElementSize,
  UseResizeObserverOptions,
} from "@vueuse/core";
import { computed } from "vue";

export function useElementDeviceSize(
  target: MaybeComputedElementRef<MaybeElement>,
  initialSize?: ElementSize | undefined,
  options?: UseResizeObserverOptions | undefined,
) {
  const { width, height } = useElementSize(target, initialSize, options);
  return {
    width: computed(() => width.value * window.devicePixelRatio),
    height: computed(() => height.value * window.devicePixelRatio),
  };
}
