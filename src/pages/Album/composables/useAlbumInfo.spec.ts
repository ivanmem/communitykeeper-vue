import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { VkApiError } from "@/shared/services/vkApiErrors";
import { noop } from "es-toolkit";
import { useAlbumInfo } from "@/pages/Album/composables/useAlbumInfo";
import { IAlbumItem } from "@/store/vk/IAlbumItem";

const { getCachedAlbum } = vi.hoisted(() => ({ getCachedAlbum: vi.fn() }));

vi.mock("@/store/vk/vk", () => ({
  useVk: () => ({ getApiService: async () => ({ getCachedAlbum }) }),
}));

function createAlbum(id: number): IAlbumItem {
  return { id, owner_id: 1, size: 5, title: `Альбом ${id}` };
}

function createVkError(errorCode: number) {
  return new VkApiError({
    error_code: errorCode,
    error_msg: "error",
    request_params: [],
  });
}

describe("useAlbumInfo", () => {
  beforeEach(() => {
    getCachedAlbum.mockReset();
  });

  it("загружает информацию об актуальном альбоме", async () => {
    getCachedAlbum.mockResolvedValueOnce(createAlbum(2));
    const albumId = ref(1);
    const info = useAlbumInfo(1, albumId);

    albumId.value = 2;
    await info.load();

    expect(getCachedAlbum).toHaveBeenCalledWith({ owner_id: 1, album_id: 2 });
    expect(info.album.value).toEqual(createAlbum(2));
    expect(info.isLoading.value).toBe(false);
  });

  it("игнорирует ошибку доступа", async () => {
    getCachedAlbum.mockRejectedValueOnce(createVkError(15));
    const info = useAlbumInfo(1, 1);

    await info.load();

    expect(info.album.value).toBeUndefined();
    expect(info.error.value).toBeUndefined();
  });

  it("сохраняет остальные ошибки", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(noop);
    getCachedAlbum.mockRejectedValueOnce(createVkError(10));
    const info = useAlbumInfo(1, 1);

    await info.load();

    expect(info.error.value).toBeTruthy();
    expect(info.isLoading.value).toBe(false);
    warn.mockRestore();
  });

  it("отбрасывает ответ, пришедший после сброса", async () => {
    let resolveStale!: (album: IAlbumItem) => void;
    getCachedAlbum.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveStale = resolve;
      }),
    );
    const info = useAlbumInfo(1, 1);

    const stale = info.load();
    info.reset();
    resolveStale(createAlbum(1));
    await stale;

    expect(info.album.value).toBeUndefined();
    expect(info.isLoading.value).toBe(false);
  });

  it("игнорирует ошибку запроса, начатого до сброса", async () => {
    let rejectStale!: (ex: unknown) => void;
    getCachedAlbum.mockReturnValueOnce(
      new Promise((_, reject) => {
        rejectStale = reject;
      }),
    );
    const info = useAlbumInfo(1, 1);

    const stale = info.load();
    info.reset();
    rejectStale(createVkError(10));
    await stale;

    expect(info.error.value).toBeUndefined();
  });
});
