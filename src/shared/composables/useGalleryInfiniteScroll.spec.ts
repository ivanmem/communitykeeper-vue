import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { useInfiniteScroll } from "@vueuse/core";
import { useGalleryInfiniteScroll } from "@/shared/composables/useGalleryInfiniteScroll";

vi.mock("@vueuse/core", () => ({ useInfiniteScroll: vi.fn() }));

function setup() {
  const el = ref<HTMLElement>();
  const pagination = {
    loadNext: vi.fn(async () => {}),
    isAllLoaded: ref(false),
    error: ref<string>(),
  };
  useGalleryInfiniteScroll(el, pagination);
  const [element, onLoadMore, options] = vi.mocked(useInfiniteScroll).mock
    .calls[0];
  const canLoadMore = () => options!.canLoadMore!(el.value);
  return { el, pagination, element, onLoadMore, options, canLoadMore };
}

describe("useGalleryInfiniteScroll", () => {
  beforeEach(() => {
    vi.mocked(useInfiniteScroll).mockClear();
  });

  it("подгружает следующую порцию пагинации с запасом до конца списка", () => {
    const { el, pagination, element, onLoadMore, options } = setup();

    expect(element).toBe(el);
    expect(onLoadMore).toBe(pagination.loadNext);
    expect(options?.distance).toBeGreaterThan(0);
  });

  it("разрешает подгрузку, пока есть что грузить", () => {
    const { canLoadMore } = setup();

    expect(canLoadMore()).toBe(true);
  });

  it("запрещает подгрузку, когда всё загружено", () => {
    const { pagination, canLoadMore } = setup();

    pagination.isAllLoaded.value = true;

    expect(canLoadMore()).toBe(false);
  });

  it("запрещает подгрузку после ошибки, чтобы не повторять её бесконечно", () => {
    const { pagination, canLoadMore } = setup();

    pagination.error.value = "network";

    expect(canLoadMore()).toBe(false);
  });
});
