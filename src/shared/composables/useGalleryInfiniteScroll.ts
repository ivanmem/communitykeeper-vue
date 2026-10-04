import { MaybeRefOrGetter } from "vue";
import { useInfiniteScroll } from "@vueuse/core";
import { useOffsetPagination } from "@/shared/composables/useOffsetPagination";

// Расстояние до конца списка в px, с которого начинаем грузить следующую порцию
const loadMoreDistance = 1000;

/**
 * @description Подгружает порции, когда список прокручен близко к концу или не заполняет экран.
 * Проверка повторяется после каждой порции, поэтому список догружается и без новых событий прокрутки.
 */
export function useGalleryInfiniteScroll(
  el: MaybeRefOrGetter<HTMLElement | undefined>,
  {
    loadNext,
    isAllLoaded,
    error,
  }: Pick<
    ReturnType<typeof useOffsetPagination>,
    "loadNext" | "isAllLoaded" | "error"
  >,
) {
  useInfiniteScroll(el, loadNext, {
    distance: loadMoreDistance,
    // При ошибке не повторяем запросы бесконечно: её показывают на экране
    canLoadMore: () => !isAllLoaded.value && !error.value,
  });
}
