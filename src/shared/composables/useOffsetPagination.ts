import { ref } from "vue";
import { errorToString } from "@/shared/helpers/errorToString";

export interface OffsetPage<T> {
  items: T[];
  count: number;
}

export interface UseOffsetPaginationOptions<T> {
  pageSize: number;
  fetchPage: (offset: number, count: number) => Promise<OffsetPage<T>>;
  /** Получает элементы порции. Вызывается только для актуального запроса. */
  onPage: (items: T[]) => void;
}

/** @description Последовательная загрузка порций по смещению с защитой от гонок при сбросе */
export function useOffsetPagination<T>({
  pageSize,
  fetchPage,
  onPage,
}: UseOffsetPaginationOptions<T>) {
  const isLoading = ref(false);
  const isAllLoaded = ref(false);
  const isInit = ref(false);
  const error = ref<string>();
  const totalCount = ref<number>();

  // Смещение считается по ответам сервера, а не по показанным элементам,
  // иначе отброшенные дубли не дают ему сдвинуться и загрузка зацикливается.
  let offset = 0;
  // Ответы запросов, начатых до reset, отбрасываются по номеру поколения.
  let generation = 0;
  let pending: Promise<void> | undefined;

  function reset() {
    generation++;
    pending = undefined;
    offset = 0;
    isLoading.value = false;
    isAllLoaded.value = false;
    isInit.value = false;
    error.value = undefined;
    totalCount.value = undefined;
  }

  /** Повторный вызов во время загрузки возвращает текущий запрос. */
  function loadNext(): Promise<void> {
    if (isAllLoaded.value) {
      return Promise.resolve();
    }

    return (pending ??= load(generation));
  }

  async function load(currentGeneration: number) {
    isLoading.value = true;
    error.value = undefined;

    try {
      const page = await fetchPage(offset, pageSize);
      if (currentGeneration !== generation) {
        return;
      }

      // Отладочный лог: в прод-сборку не попадает
      if (import.meta.env.DEV) {
        console.log("[Пагинация] порция", {
          offset,
          requested: pageSize,
          received: page.items.length,
          total: page.count,
        });
      }

      offset += page.items.length;
      totalCount.value = page.count;
      isAllLoaded.value =
        page.items.length < pageSize || offset >= page.count;
      onPage(page.items);
    } catch (ex) {
      if (currentGeneration !== generation) {
        return;
      }

      error.value = errorToString(ex);
      console.warn("Ошибка загрузки порции:", ex);
    } finally {
      if (currentGeneration === generation) {
        pending = undefined;
        isLoading.value = false;
        isInit.value = true;
      }
    }
  }

  return {
    isLoading,
    isAllLoaded,
    isInit,
    error,
    totalCount,
    loadNext,
    reset,
  };
}
