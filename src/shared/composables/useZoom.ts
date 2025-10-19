import { MaybeRefOrGetter, onMounted, onUpdated, Ref, toRef, watch } from "vue";
import { useMonitor } from "@/shared/composables/useMonitor";
import { computedWithControl, useInterval } from "@vueuse/core";
import { isDev } from "@/shared/constants/consts";
import { useApp } from "@/store/app/app";

export interface UsableZoomOptions {
  /*** Изображение в [image] будет увеличено с помощью style.transform */
  image: Ref<HTMLImageElement | undefined>;
  /*** При обновлении ключа зум будет сброшен */
  key: MaybeRefOrGetter;
  /*** При активном pinch [enabled] is true. При true следует выключить остальные события, чтобы изображение можно было двигать одним касанием. */
  enabled: Ref<boolean>;
}

const MIN_SCALE = 1;
const MAX_SCALE = 4;
const MIN_SCALE_RUBBER_BAND = 0.85; // Можно уменьшить ниже 1 для визуального фидбека
const ANIMATION_DURATION = 250;

/** @description Функция позволяет делать pinch изображения, которое обёрнуто в div.
 * Возвращаемые события следует устанавливать на div.
 * При успешной обработке каждое событие вернёт true.
 * Если событие возвращает false, значит оно не было задействовано и вы сможете обработать другой жест. */
export function useZoom({ image, key, enabled }: UsableZoomOptions) {
  const appStore = useApp();
  
  let scale: number = 1;
  let posX: number = 0;
  let posY: number = 0;

  // Pinch zoom переменные
  let initialDistance: number | null = null;
  let initialScale: number = 1;
  let pinchCenterX: number = 0;
  let pinchCenterY: number = 0;
  let pinchStartPosX: number = 0;
  let pinchStartPosY: number = 0;

  // Переменные для движения одним пальцем
  let panStartX: number | null = null;
  let panStartY: number | null = null;
  let panInitialPosX: number = 0;
  let panInitialPosY: number = 0;

  const imageStyle = computedWithControl(image, () =>
    image.value ? window.getComputedStyle(image.value) : undefined,
  );
  const cssZoom = toRef(() => parseFloat(imageStyle.value?.zoom || "1"));

  if (isDev) {
    const paneParams: Record<string, any> = {};
    onPaneUpdated();
    useMonitor(paneParams);

    function onPaneUpdated() {
      paneParams.scale = scale;
      paneParams.posX = posX;
      paneParams.posY = posY;
      paneParams.enabled = enabled.value;
      paneParams.initialDistance = initialDistance;
      paneParams.pinchCenter = { x: pinchCenterX, y: pinchCenterY };
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
    scale = 1;
    posX = 0;
    posY = 0;
    initialDistance = null;
    initialScale = 1;
    pinchCenterX = 0;
    pinchCenterY = 0;
    pinchStartPosX = 0;
    pinchStartPosY = 0;
    panStartX = null;
    panStartY = null;
    panInitialPosX = 0;
    panInitialPosY = 0;
    enabled.value = false;

    image.value?.style.removeProperty("transform");
    image.value?.style.removeProperty("transition");
  }

  watch(toRef(key), reset);

  function getDistance(touch1: Touch, touch2: Touch): number {
    const dx = touch1.pageX - touch2.pageX;
    const dy = touch1.pageY - touch2.pageY;
    return Math.sqrt(dx * dx + dy * dy);
  }

  function getBounds(): {
    minX: number;
    maxX: number;
    minY: number;
    maxY: number;
  } | null {
    if (!image.value) return null;

    const img = image.value;
    const parent = img.parentElement;
    if (!parent) return null;

    const imgRect = img.getBoundingClientRect();
    const parentRect = parent.getBoundingClientRect();

    // Размеры изображения с учетом масштаба
    const scaledWidth = imgRect.width * scale;
    const scaledHeight = imgRect.height * scale;

    // Если изображение меньше контейнера, центрируем его
    if (scaledWidth <= parentRect.width) {
      return { minX: 0, maxX: 0, minY: 0, maxY: 0 };
    }

    // Максимальное смещение = (размер изображения - размер контейнера) / 2
    const maxX = (scaledWidth - parentRect.width) / 2;
    const maxY = (scaledHeight - parentRect.height) / 2;

    return {
      minX: -maxX,
      maxX: maxX,
      minY: -maxY,
      maxY: maxY,
    };
  }

  function constrainPosition(x: number, y: number): { x: number; y: number } {
    const bounds = getBounds();
    if (!bounds) return { x: 0, y: 0 };

    return {
      x: Math.max(bounds.minX, Math.min(bounds.maxX, x)),
      y: Math.max(bounds.minY, Math.min(bounds.maxY, y)),
    };
  }

  function applyTransform(withTransition = false, applyConstraints = false) {
    if (!image.value) return;

    // Применяем ограничения только если явно указано (при завершении жеста)
    if (applyConstraints) {
      const constrained = constrainPosition(posX, posY);
      posX = constrained.x;
      posY = constrained.y;
    }

    if (withTransition) {
      image.value.style.transition = `transform ${ANIMATION_DURATION}ms cubic-bezier(0.25, 0.46, 0.45, 0.94)`;
    } else {
      image.value.style.transition = "none";
    }

    image.value.style.transform = `translate(${posX}px, ${posY}px) scale(${scale})`;

    if (withTransition) {
      setTimeout(() => {
        if (image.value) {
          image.value.style.transition = "none";
        }
      }, ANIMATION_DURATION);
    }
  }

  function touchstart(evt: TouchEvent) {
    imageStyle.trigger();

    // Движение одним пальцем при активном зуме
    if (evt.touches.length === 1 && enabled.value) {
      const touch = evt.touches[0];
      panStartX = touch.pageX;
      panStartY = touch.pageY;
      panInitialPosX = posX;
      panInitialPosY = posY;
      return true;
    }

    // Pinch zoom
    if (!image.value || evt.touches.length !== 2) {
      return false;
    }

    initialDistance = getDistance(evt.touches[0], evt.touches[1]);
    initialScale = scale;

    // Получаем реальные координаты изображения с учетом текущего transform
    const imgRect = image.value.getBoundingClientRect();

    // Центр между двумя пальцами в координатах страницы
    const touchCenterX = (evt.touches[0].pageX + evt.touches[1].pageX) / 2;
    const touchCenterY = (evt.touches[0].pageY + evt.touches[1].pageY) / 2;

    // Координаты центра изображения (getBoundingClientRect относительно viewport, нужно добавить scroll)
    const imgCenterX = imgRect.left + window.scrollX + imgRect.width / 2;
    const imgCenterY = imgRect.top + window.scrollY + imgRect.height / 2;

    // Точка касания относительно центра изображения
    // В Chromium 128 изменилось поведение CSS zoom с getBoundingClientRect и touch координатами
    // До 128: pageX/pageY не учитывают CSS zoom → (touchCenter / cssZoom - imgCenter) / scale
    // С 128+: pageX/pageY учитывают CSS zoom → (touchCenter - imgCenter) / (scale * cssZoom)
    const chromeMatch = navigator.userAgent.match(/Chrome\/(\d+)/);
    const chromeVersion = chromeMatch ? parseInt(chromeMatch[1]) : 999;
    const useOldZoomLogic = appStore.isIos || chromeVersion < 128;
    const touchDivisor = useOldZoomLogic ? cssZoom.value : 1;
    const scaleDivisor = useOldZoomLogic ? scale : scale * cssZoom.value;
    
    pinchCenterX = (touchCenterX / touchDivisor - imgCenterX) / scaleDivisor;
    pinchCenterY = (touchCenterY / touchDivisor - imgCenterY) / scaleDivisor;

    pinchStartPosX = posX;
    pinchStartPosY = posY;

    return true;
  }

  function touchmove(evt: TouchEvent) {
    // Движение одним пальцем
    if (
      evt.touches.length === 1 &&
      panStartX !== null &&
      panStartY !== null &&
      enabled.value
    ) {
      const touch = evt.touches[0];
      const dx = touch.pageX - panStartX;
      const dy = touch.pageY - panStartY;

      // Учитываем CSS zoom - если zoom < 1, нужно двигать быстрее
      posX = panInitialPosX + dx / cssZoom.value;
      posY = panInitialPosY + dy / cssZoom.value;

      applyTransform();
      return true;
    }

    // Pinch zoom
    if (!image.value || evt.touches.length !== 2 || initialDistance === null) {
      return false;
    }

    const currentDistance = getDistance(evt.touches[0], evt.touches[1]);
    const newScale = Math.max(
      MIN_SCALE_RUBBER_BAND,
      Math.min(MAX_SCALE, (initialScale * currentDistance) / initialDistance),
    );

    // Включаем enabled только когда реально увеличили
    if (!enabled.value && newScale > MIN_SCALE + 0.05) {
      enabled.value = true;
    }
    
    posX = pinchStartPosX - pinchCenterX * (newScale - initialScale);
    posY = pinchStartPosY - pinchCenterY * (newScale - initialScale);
    scale = newScale;

    applyTransform();
    return true;
  }

  function touchend(evt: TouchEvent) {
    if (initialDistance === null && panStartX === null) {
      return false;
    }

    // Завершение движения одним пальцем
    if (evt.touches.length === 0 && panStartX !== null) {
      panStartX = null;
      panStartY = null;
      applyTransform(true, true);
    }

    // Завершение pinch
    if (evt.touches.length < 2 && initialDistance !== null) {
      initialDistance = null;

      // Если уменьшили ниже минимума (rubber band эффект), возвращаем к 1
      if (scale < MIN_SCALE) {
        scale = MIN_SCALE;
        posX = 0;
        posY = 0;
        enabled.value = false;
      }

      applyTransform(true, true);
    }

    return evt.touches.length >= 2;
  }

  return { touchstart, touchmove, touchend };
}
