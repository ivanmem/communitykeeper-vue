export interface UsableSwipesOptions {
  onLeft?: (e: TouchEvent) => any;
  onRight?: (e: TouchEvent) => any;
  onUp?: (e: TouchEvent) => any;
  onDown?: (e: TouchEvent) => any;
  minDiffTrigger?: number;
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
    if (!xDown || !yDown) {
      return;
    }

    let xUp = evt.touches[0].clientX;
    let yUp = evt.touches[0].clientY;

    let xDiff = xDown - xUp;
    let yDiff = yDown - yUp;
    xDown = null;
    yDown = null;

    const minDiffTrigger = opts.minDiffTrigger ?? 10 / window.devicePixelRatio;
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
