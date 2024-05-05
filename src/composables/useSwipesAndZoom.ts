import { UsableSwipesOptions, useSwipes } from "@/composables/useSwipes";
import { UsableZoomOptions, useZoom } from "@/composables/useZoom";

export function useSwipesAndZoom(
  swipesOpts: UsableSwipesOptions,
  zoomOpts: UsableZoomOptions,
) {
  const swipeHandlers = useSwipes(swipesOpts);
  const zoomHandlers = useZoom(zoomOpts);
  let lastZoomMilliseconds: number = 0;
  const timeout: number = 200;

  function isZoomEvent(result: boolean) {
    if (result || zoomOpts.enabled.value) {
      lastZoomMilliseconds = Date.now();
      return true;
    }

    return Date.now() - lastZoomMilliseconds < timeout;
  }

  const contextmenu = swipeHandlers["contextmenu"]
    ? (e: MouseEvent | TouchEvent) => {
        if (isZoomEvent(false)) {
          return;
        }

        return swipeHandlers.contextmenu?.(e);
      }
    : undefined;

  return {
    ...swipeHandlers,
    contextmenu,
    touchstart: (evt: TouchEvent) => {
      if (isZoomEvent(zoomHandlers.touchstart(evt))) {
        swipeHandlers.touchstart(evt, true)
        return;
      }

      return swipeHandlers.touchstart(evt);
    },
    touchmove: (evt: TouchEvent) => {
      if (isZoomEvent(zoomHandlers.touchmove(evt))) {
        return;
      }

      return swipeHandlers.touchmove(evt);
    },
    touchend: (evt: TouchEvent) => {
      if (isZoomEvent(zoomHandlers.touchend(evt))) {
        return;
      }

      return swipeHandlers.touchend?.(evt);
    },
  };
}
