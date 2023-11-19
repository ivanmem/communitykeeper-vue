import { useApp } from "@/store/app/app";

export interface UsableSwipesOptions {
  onLeft?: (e: TouchEvent) => any;
  onRight?: (e: TouchEvent) => any;
  onUp?: (e: TouchEvent) => any;
  onDown?: (e: TouchEvent) => any;
  minDiffTrigger?: number;
  /** @description Если палец будет двигаться в любую из сторон на указанный процент, то свайп будет проигнорирован.
   * Максимальное значение - 50%, тогда срабатывать будет в любом случае.
   * При 0% срабатывать будет только под полным прямым углом.*/
  precisionDirection?: number;
}

/** @description Функция позволяет установить обработчики на свайпы в определённые стороны */
export function useSwipes(opts: UsableSwipesOptions) {
  let xDown: number | null = null;
  let yDown: number | null = null;


  function touchstart(evt: TouchEvent) {
    const firstTouch = evt.touches[0];
    xDown = firstTouch.clientX;
    yDown = firstTouch.clientY;
  }

  function touchmove(evt: TouchEvent) {
    if (!xDown || !yDown || evt.touches.length > 1) {
      return;
    }

    let xUp = evt.touches[0].clientX;
    let yUp = evt.touches[0].clientY;

    let xDiff = xDown - xUp;
    let yDiff = yDown - yUp;
    xDown = null;
    yDown = null;

    const minDiffTrigger = opts.minDiffTrigger ?? 20 / window.devicePixelRatio;
    const precisionDirection = opts.precisionDirection ?? 35;
    const allDiff = Math.abs(xDiff) + Math.abs(yDiff);
    const minDiff = Math.min(Math.abs(xDiff), Math.abs(yDiff));
    const currentPrecisionDirection = minDiff / (allDiff / 100);
    if (currentPrecisionDirection > precisionDirection) {
      return;
    }

    if (Math.abs(xDiff) > Math.abs(yDiff)) {
      if (Math.abs(xDiff) < minDiffTrigger) {
        return;
      }

      if (xDiff > 0) {
        opts.onRight?.(evt);
      } else {
        opts.onLeft?.(evt);
      }
    } else {
      if (Math.abs(yDiff) < minDiffTrigger) {
        return;
      }

      if (yDiff > 0) {
        opts.onDown?.(evt);
      } else {
        opts.onUp?.(evt);
      }
    }
  }

  return {
    touchstart,
    touchmove,
  };
}
