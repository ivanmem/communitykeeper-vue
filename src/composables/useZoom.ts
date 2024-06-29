import { MaybeRefOrGetter, onMounted, onUpdated, Ref, toRef, watch } from "vue";
import { useMonitor } from "@/composables/useMonitor";
import { useInterval } from "@vueuse/core";
import { isDev } from "@/common/consts";

export interface UsableZoomOptions {
  /*** Изображение в [image] будет увеличено с помощью style.transform */
  image: Ref<HTMLImageElement | undefined>;
  /*** При обновлении ключа зум будет сброшен */
  key: MaybeRefOrGetter;
  /*** При активном pinch [enabled] is true. При true следует выключить остальные события, чтобы изображение можно было двигать одним касанием. */
  enabled: Ref<boolean>;
}

/** @description Функция позволяет делать pinch изображения, которое обёрнуто в div.
 * Возвращаемые события следует устанавливать на div.
 * При успешной обработке каждое событие вернёт true.
 * Если событие возвращает false, значит оно не было задействовано и вы сможете обработать другой жест. */
export function useZoom({ image, key, enabled }: UsableZoomOptions) {
  let initialDistance: number | null = null;
  let initialScale: number = 1;
  let scale: number = 1;
  let initialOrigin: { x: number; y: number } | null = null;

  // переменные для движения фото пальцем
  let initialTouch: { x: number; y: number } | null = null;
  let initialPosition: { x: number; y: number } = { x: 0, y: 0 };
  let position: { x: number; y: number } = { x: 0, y: 0 };

  if (isDev) {
    const paneParams: Record<string, any> = {};
    onPaneUpdated();
    useMonitor(paneParams);

    function onPaneUpdated() {
      paneParams.initialDistance = initialDistance;
      paneParams.initialScale = initialScale;
      paneParams.scale = scale;
      paneParams.initialOrigin = initialOrigin;
      paneParams.initialTouch = initialTouch;
      paneParams.initialPosition = initialPosition;
      paneParams.position = position;
    }


    useInterval(100, {
      callback() {
        onPaneUpdated();
      },
    });


    onUpdated(() => {
      onPaneUpdated();
    });

    onMounted(() => {
      onPaneUpdated();
    });
  }

  function reset() {
    initialOrigin = null;
    scale = 1;
    initialScale = 1;
    initialDistance = null;
    enabled.value = false;
    initialPosition = { x: 0, y: 0 };
    position = { x: 0, y: 0 };
    image.value?.style.removeProperty("transform");
  }

  watch(toRef(key), reset);

  function getDistance(touch1: Touch, touch2: Touch) {
    const dx = touch1.clientX - touch2.clientX;
    const dy = touch1.clientY - touch2.clientY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function touchstart(evt: TouchEvent) {
    if (evt.touches.length === 1 && enabled.value) {
      const touch = evt.touches[0];
      initialTouch = { x: touch.clientX, y: touch.clientY };
      initialPosition = { ...position };
      return true;
    }

    if (!image.value || evt.touches.length != 2) {
      return false;
    }

    initialDistance = getDistance(evt.touches[0], evt.touches[1]);
    initialScale = scale;
    enabled.value = true;

    const div = evt.target as HTMLDivElement;
    const divRect = div.getBoundingClientRect();

    if (image.value) {
      const x =
        (evt.touches[0].clientX + evt.touches[1].clientX) / 2 - divRect.left;
      const y =
        (evt.touches[0].clientY + evt.touches[1].clientY) / 2 - divRect.top;
      initialOrigin = { x, y };
    }

    return true;
  }

  function touchmove(evt: TouchEvent) {
    if (evt.touches.length === 1 && initialTouch && enabled.value) {
      const touch = evt.touches[0];
      const dx = touch.clientX - initialTouch.x;
      const dy = touch.clientY - initialTouch.y;

      const div = evt.target as HTMLDivElement;
      const divRect = div.getBoundingClientRect();
      const imageRect = image.value?.getBoundingClientRect();

      if (image.value && imageRect) {
        position.x = initialPosition.x + dx;
        position.y = initialPosition.y + dy;
        image.value.style.transform = `translate(${position.x}px, ${position.y}px) scale(${scale})`;
      }

      return true;
    }

    if (
      !image.value ||
      evt.touches.length != 2 ||
      initialDistance == null ||
      !initialOrigin ||
      !enabled.value
    ) {
      return false;
    }

    const currentDistance = getDistance(evt.touches[0], evt.touches[1]);
    const prevScale = scale;
    scale = (initialScale * currentDistance) / initialDistance;

    const div = evt.target as HTMLDivElement;
    const divRect = div.getBoundingClientRect();

    if (image.value) {
      const x =
        (evt.touches[0].clientX + evt.touches[1].clientX) / 2 - divRect.left;
      const y =
        (evt.touches[0].clientY + evt.touches[1].clientY) / 2 - divRect.top;
      const dx = x - initialOrigin.x;
      const dy = y - initialOrigin.y;
      image.value.style.transform = `translate(${dx}px, ${dy}px) scale(${scale})`;
    }

    // если scale уменьшился по сравнению с предыдущим
    // и он стал меньше, либо равен оригинальному масштабированию - сбрасываем зуммирование
    if (prevScale > scale && scale <= 1) {
      reset();
    }

    return true;
  }

  function touchend(evt: TouchEvent) {
    if (initialDistance == null && !initialOrigin && !initialTouch) {
      return false;
    }

    if (evt.touches.length === 0 && initialTouch) {
      initialTouch = null;
    }

    if (evt.touches.length >= 2) {
      return true;
    }

    return true;
  }

  return { touchstart, touchmove, touchend };
}
