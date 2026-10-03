import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  OffsetPage,
  useOffsetPagination,
} from "@/shared/composables/useOffsetPagination";

const fetchPage = vi.fn<(offset: number, count: number) => Promise<OffsetPage<number>>>();
const onPage = vi.fn<(items: number[]) => void>();

function range(from: number, count: number) {
  return Array.from({ length: count }, (_, i) => from + i);
}

function setup() {
  return useOffsetPagination({ pageSize: 3, fetchPage, onPage });
}

// Запрос, который завершается вручную
function deferredPage() {
  let resolve!: (page: OffsetPage<number>) => void;
  const promise = new Promise<OffsetPage<number>>((r) => {
    resolve = r;
  });
  fetchPage.mockReturnValueOnce(promise);
  return resolve;
}

describe("useOffsetPagination", () => {
  beforeEach(() => {
    fetchPage.mockReset();
    onPage.mockReset();
  });

  it("сдвигает смещение по количеству полученных элементов", async () => {
    fetchPage
      .mockResolvedValueOnce({ items: range(1, 3), count: 10 })
      .mockResolvedValueOnce({ items: range(4, 3), count: 10 });
    const pagination = setup();

    await pagination.loadNext();
    await pagination.loadNext();

    expect(fetchPage.mock.calls).toEqual([
      [0, 3],
      [3, 3],
    ]);
    expect(onPage).toHaveBeenLastCalledWith([4, 5, 6]);
    expect(pagination.totalCount.value).toBe(10);
  });

  it("завершает загрузку на короткой порции", async () => {
    fetchPage.mockResolvedValueOnce({ items: range(1, 2), count: 100 });
    const pagination = setup();

    await pagination.loadNext();
    await pagination.loadNext();

    expect(pagination.isAllLoaded.value).toBe(true);
    expect(fetchPage).toHaveBeenCalledOnce();
  });

  it("завершает загрузку, когда смещение достигло общего количества", async () => {
    fetchPage.mockResolvedValueOnce({ items: range(1, 3), count: 3 });
    const pagination = setup();

    await pagination.loadNext();

    expect(pagination.isAllLoaded.value).toBe(true);
  });

  it("возвращает текущий запрос при повторном вызове во время загрузки", async () => {
    const resolve = deferredPage();
    const pagination = setup();

    const first = pagination.loadNext();
    const second = pagination.loadNext();
    expect(pagination.isLoading.value).toBe(true);

    resolve({ items: range(1, 3), count: 10 });
    await Promise.all([first, second]);

    expect(first).toBe(second);
    expect(fetchPage).toHaveBeenCalledOnce();
    expect(pagination.isLoading.value).toBe(false);
  });

  it("отбрасывает ответ запроса, начатого до сброса", async () => {
    const resolveStale = deferredPage();
    fetchPage.mockResolvedValueOnce({ items: range(10, 3), count: 10 });
    const pagination = setup();

    const stale = pagination.loadNext();
    pagination.reset();
    expect(pagination.isLoading.value).toBe(false);

    await pagination.loadNext();
    resolveStale({ items: range(1, 3), count: 10 });
    await stale;

    expect(onPage).toHaveBeenCalledOnce();
    expect(onPage).toHaveBeenCalledWith([10, 11, 12]);
    expect(fetchPage.mock.calls).toEqual([
      [0, 3],
      [0, 3],
    ]);
  });

  it("не даёт устаревшему запросу снять флаг загрузки нового", async () => {
    const resolveStale = deferredPage();
    const resolveFresh = deferredPage();
    const pagination = setup();

    const stale = pagination.loadNext();
    pagination.reset();
    const fresh = pagination.loadNext();

    resolveStale({ items: range(1, 3), count: 10 });
    await stale;
    expect(pagination.isLoading.value).toBe(true);

    resolveFresh({ items: range(1, 3), count: 10 });
    await fresh;
    expect(pagination.isLoading.value).toBe(false);
  });

  it("игнорирует ошибку запроса, начатого до сброса", async () => {
    let reject!: (ex: Error) => void;
    fetchPage.mockReturnValueOnce(
      new Promise((_, r) => {
        reject = r;
      }),
    );
    const pagination = setup();

    const stale = pagination.loadNext();
    pagination.reset();
    reject(new Error("network"));
    await stale;

    expect(pagination.error.value).toBeUndefined();
    expect(pagination.isInit.value).toBe(false);
  });

  it("сохраняет ошибку и позволяет повторить загрузку с того же смещения", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(() => {});
    fetchPage
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ items: range(1, 3), count: 10 });
    const pagination = setup();

    await pagination.loadNext();
    expect(pagination.error.value).toBeTruthy();
    expect(pagination.isInit.value).toBe(true);
    expect(pagination.isLoading.value).toBe(false);

    await pagination.loadNext();
    expect(pagination.error.value).toBeUndefined();
    expect(fetchPage.mock.calls).toEqual([
      [0, 3],
      [0, 3],
    ]);
    warn.mockRestore();
  });

  it("начинает с нулевого смещения после сброса", async () => {
    fetchPage.mockResolvedValue({ items: range(1, 2), count: 2 });
    const pagination = setup();

    await pagination.loadNext();
    pagination.reset();

    expect(pagination.isAllLoaded.value).toBe(false);
    expect(pagination.isInit.value).toBe(false);
    expect(pagination.totalCount.value).toBeUndefined();

    await pagination.loadNext();
    expect(fetchPage).toHaveBeenLastCalledWith(0, 3);
  });
});
