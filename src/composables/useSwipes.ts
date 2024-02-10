import { useApp } from "@/store/app/app";

const longTouchDuration = 400; // Минимальная продолжительность сенсорного нажатия для эмуляции contextmenu
const touchMoveThreshold = 10; // Минимальное смещение для считывания как смещение касания

export interface UsableSwipesOptions {
  onLeft?: (e: TouchEvent) => any;
  onRight?: (e: TouchEvent) => any;
  onDown?: (e: TouchEvent) => any;
  onUp?: (e: TouchEvent) => any;
  /** @description contextmenu работающий на IOS mobile */
  onContextMenu?: (e: MouseEvent | TouchEvent) => any;
  minDiffTrigger?: number;
  /** @description Если палец будет двигаться в любую из сторон на указанный процент, то свайп будет проигнорирован.
   * Максимальное значение - 50%, тогда срабатывать будет в любом случае.
   * При 0% срабатывать будет только под полным прямым углом.*/
  precisionDirection?: number;
}

/** @description Функция позволяет установить обработчики на свайпы в определённые стороны и contextmenu (модернизированный для работы с IOS mobile) */
export function useSwipes(opts: UsableSwipesOptions) {
  let xDown: number | null = null;
  let yDown: number | null = null;

  // contextmenu variables
  let touchStartTime = 0;
  let touchStartX: number | undefined;
  let touchStartY: number | undefined;
  let touchMoved = false;
  let checkLongTouchTimeout: NodeJS.Timeout | undefined;

  const appStore = useApp();

  function touchstart(evt: TouchEvent) {
    const firstTouch = evt.touches[0];
    xDown = firstTouch.clientX;
    yDown = firstTouch.clientY;
    if (opts.onContextMenu && appStore.isIos) {
      touchMoved = false;
      touchStartX = firstTouch.clientX;
      touchStartY = firstTouch.clientY;
      touchStartTime = new Date().getTime();
      checkLongTouchTimeout = setTimeout(
        () => checkLongTouch(evt),
        longTouchDuration,
      );
    }
  }

  function touchmove(evt: TouchEvent) {
    if (touchStartX !== undefined && touchStartY !== undefined) {
      const touchCurrentX = evt.touches[0].clientX;
      const touchCurrentY = evt.touches[0].clientY;
      const distanceX = Math.abs(touchCurrentX - touchStartX);
      const distanceY = Math.abs(touchCurrentY - touchStartY);

      if (distanceX > touchMoveThreshold || distanceY > touchMoveThreshold) {
        touchMoved = true;
      }
    }

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
        opts.onUp?.(evt);
      } else {
        opts.onDown?.(evt);
      }
    }
  }

  function checkLongTouch(evt: TouchEvent) {
    if (
      touchStartX !== undefined &&
      touchStartY !== undefined &&
      !touchMoved &&
      new Date().getTime() - touchStartTime >= longTouchDuration
    ) {
      contextmenu(evt);
    }
  }

  function contextmenu(e: MouseEvent | TouchEvent) {
    if (!opts.onContextMenu) {
      return;
    }

    e.preventDefault();
    e.stopPropagation();
    opts.onContextMenu?.(e);
  }

  const events: Record<any, any> = {
    touchstart,
    touchmove,
  };
  if (opts.onContextMenu) {
    if (appStore.isIos) {
      function touchendOrTouchCancel() {
        touchMoved = false;
        touchStartX = undefined;
        touchStartY = undefined;
        clearTimeout(checkLongTouchTimeout);
      }

      events.touchend = touchendOrTouchCancel;
      events.touchcancel = touchendOrTouchCancel;
    } else {
      events.contextmenu = contextmenu;
    }
  }

  return events;
}
