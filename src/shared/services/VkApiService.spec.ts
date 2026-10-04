import { beforeEach, describe, expect, it, vi } from "vitest";
import { noop, range } from "es-toolkit";
import { VkApiService } from "@/shared/services/VkApiService";
import { VkTransportError } from "@/shared/services/createJsonpSendRequest";
import { IAlbumItem } from "@/store/vk/IAlbumItem";

const { sleep, initVk, vkStore } = vi.hoisted(() => ({
  sleep: vi.fn(async () => {}),
  initVk: vi.fn(async () => true),
  vkStore: { token: { access_token: "token" } as { access_token: string } | undefined },
}));

vi.mock("@/shared/helpers/sleep", () => ({ sleep }));

vi.mock("@/store/vk/vk", () => ({
  useVk: () => ({ initVk, token: vkStore.token }),
}));

const addRequestToQueue = vi.fn();

function createService() {
  return new VkApiService({ addRequestToQueue });
}

function createVkErrorLike(errorCode: number) {
  return Object.assign(new Error(`error ${errorCode}`), {
    errorInfo: { error_code: errorCode, error_msg: "error", request_params: [] },
  });
}

function createAlbum(id: number, ownerId = -1): IAlbumItem {
  return { id, owner_id: ownerId, size: 1, title: `Альбом ${id}` };
}

describe("VkApiService", () => {
  beforeEach(() => {
    addRequestToQueue.mockReset();
    sleep.mockClear();
    initVk.mockClear();
    vi.spyOn(console, "warn").mockImplementation(noop);
  });

  describe("addRequestToQueue", () => {
    it("возвращает ответ API", async () => {
      addRequestToQueue.mockResolvedValueOnce({ count: 1 });

      const result = await createService().addRequestToQueue({
        method: "photos.get",
        params: { owner_id: 1 },
      });

      expect(result).toEqual({ count: 1 });
      expect(addRequestToQueue).toHaveBeenCalledWith({
        method: "photos.get",
        params: { owner_id: 1 },
      });
    });

    it("повторяет запрос через 2 секунды при превышении частоты запросов", async () => {
      addRequestToQueue
        .mockRejectedValueOnce(createVkErrorLike(6))
        .mockResolvedValueOnce("ok");

      const result = await createService().addRequestToQueue({
        method: "photos.get",
        params: {},
      });

      expect(result).toBe("ok");
      expect(sleep).toHaveBeenCalledWith(2000);
      expect(addRequestToQueue).toHaveBeenCalledTimes(2);
    });

    it("переинициализирует VK и повторяет запрос при ошибке авторизации", async () => {
      addRequestToQueue
        .mockRejectedValueOnce(createVkErrorLike(5))
        .mockResolvedValueOnce("ok");

      const result = await createService().addRequestToQueue({
        method: "photos.get",
        params: {},
      });

      expect(result).toBe("ok");
      expect(initVk).toHaveBeenCalledOnce();
      expect(addRequestToQueue).toHaveBeenCalledTimes(2);
    });

    it("повторяет недошедший запрос до двух раз с паузой в секунду", async () => {
      addRequestToQueue
        .mockRejectedValueOnce(new VkTransportError("network"))
        .mockRejectedValueOnce(new VkTransportError("network"))
        .mockResolvedValueOnce("ok");

      const result = await createService().addRequestToQueue({
        method: "photos.get",
        params: {},
      });

      expect(result).toBe("ok");
      expect(sleep).toHaveBeenCalledTimes(2);
      expect(sleep).toHaveBeenCalledWith(1000);
    });

    it("пробрасывает ошибку доставки после исчерпания повторов", async () => {
      const error = new VkTransportError("network");
      addRequestToQueue.mockRejectedValue(error);

      await expect(
        createService().addRequestToQueue({ method: "photos.get", params: {} }),
      ).rejects.toBe(error);
      expect(addRequestToQueue).toHaveBeenCalledTimes(3);
    });

    it("пробрасывает остальные ошибки без повтора", async () => {
      const error = createVkErrorLike(15);
      addRequestToQueue.mockRejectedValueOnce(error);

      await expect(
        createService().addRequestToQueue({ method: "photos.get", params: {} }),
      ).rejects.toBe(error);
      expect(addRequestToQueue).toHaveBeenCalledOnce();
    });
  });

  describe("методы фото", () => {
    it("getAlbums запрашивает системные альбомы с обложками", async () => {
      addRequestToQueue.mockResolvedValueOnce({ items: [], count: 0 });

      await createService().getAlbums({ owner_id: -1, offset: 10, count: 5 });

      expect(addRequestToQueue).toHaveBeenCalledWith({
        method: "photos.getAlbums",
        params: {
          owner_id: -1,
          offset: 10,
          count: 5,
          need_system: 1,
          need_covers: 1,
          photo_sizes: 1,
        },
      });
    });

    it("getCachedAlbum находит альбом и запоминает его", async () => {
      addRequestToQueue.mockResolvedValueOnce({
        items: [createAlbum(1), createAlbum(2)],
        count: 2,
      });
      const service = createService();

      const first = await service.getCachedAlbum({ owner_id: -1, album_id: 2 });
      const second = await service.getCachedAlbum({ owner_id: "-1", album_id: "2" });

      expect(first).toEqual(createAlbum(2));
      expect(second).toBe(first);
      expect(addRequestToQueue).toHaveBeenCalledOnce();
      expect(addRequestToQueue).toHaveBeenCalledWith({
        method: "photos.getAlbums",
        params: {
          owner_id: -1,
          album_id: 2,
          need_system: 1,
          need_covers: 1,
          photo_sizes: 1,
        },
      });
    });

    it("getCachedAlbum запрашивает заново для другого альбома", async () => {
      addRequestToQueue
        .mockResolvedValueOnce({ items: [createAlbum(1)], count: 1 })
        .mockResolvedValueOnce({ items: [], count: 0 });
      const service = createService();

      await service.getCachedAlbum({ owner_id: -1, album_id: 1 });
      const missing = await service.getCachedAlbum({ owner_id: -1, album_id: 3 });

      expect(missing).toBeUndefined();
      expect(addRequestToQueue).toHaveBeenCalledTimes(2);
    });

    it("photosGet передаёт параметры как есть", async () => {
      addRequestToQueue.mockResolvedValueOnce({ items: [], count: 0 });
      const params = {
        owner_id: -1,
        album_id: 5,
        offset: 150,
        count: 150,
        rev: 1,
        extended: 1,
        photo_sizes: 1,
      } as const;

      await createService().photosGet(params);

      expect(addRequestToQueue).toHaveBeenCalledWith({
        method: "photos.get",
        params,
      });
    });

    it("photosGetById по умолчанию запрашивает расширенные данные и размеры", async () => {
      addRequestToQueue.mockResolvedValue([]);
      const service = createService();

      await service.photosGetById({ photos: "-1_5" });
      await service.photosGetById({ photos: "-1_5", extended: 0, photo_sizes: 0 });

      expect(addRequestToQueue.mock.calls.map(([config]) => config.params)).toEqual([
        { photos: "-1_5", extended: 1, photo_sizes: 1 },
        { photos: "-1_5", extended: 0, photo_sizes: 0 },
      ]);
    });

    it("createAlbumItem собирает альбом из первого фото и количества", async () => {
      const sizes = [{ type: "x", url: "url", width: 1, height: 1 }];
      addRequestToQueue.mockResolvedValueOnce({ items: [{ sizes }], count: 42 });

      const album = await createService().createAlbumItem({
        owner_id: -1,
        album_id: -7,
        title: "Стена",
      });

      expect(addRequestToQueue).toHaveBeenCalledWith({
        method: "photos.get",
        params: {
          owner_id: -1,
          album_id: -7,
          count: 1,
          offset: 0,
          rev: 0,
          extended: 0,
          photo_sizes: 1,
        },
      });
      expect(album).toEqual({
        owner_id: -1,
        size: 42,
        title: "Стена",
        id: -7,
        sizes,
      });
    });

    it("createAlbumItem создаёт альбом без обложки для пустого альбома", async () => {
      addRequestToQueue.mockResolvedValueOnce({ items: [], count: 0 });

      const album = await createService().createAlbumItem({
        owner_id: -1,
        album_id: -7,
        title: "Стена",
      });

      expect(album.sizes).toBeUndefined();
      expect(album.size).toBe(0);
    });

    it("getAlbumIdFromPhotoIdAndOwnerId возвращает альбом фото", async () => {
      addRequestToQueue.mockResolvedValueOnce([{ album_id: 77 }]);

      const albumId = await createService().getAlbumIdFromPhotoIdAndOwnerId(-1, 5);

      expect(albumId).toBe(77);
      expect(addRequestToQueue).toHaveBeenCalledWith({
        method: "photos.getById",
        params: { photos: "-1_5", access_token: "token" },
      });
    });
  });

  describe("методы сообществ", () => {
    it("getGroupsByLinksOrIds превращает ссылки в идентификаторы", async () => {
      addRequestToQueue.mockResolvedValueOnce([{ id: 1 }]);

      const groups = await createService().getGroupsByLinksOrIds([
        123,
        "https://vk.com/club_name",
        "vk.com/public456",
        "plain",
      ]);

      expect(groups).toEqual([{ id: 1 }]);
      expect(addRequestToQueue).toHaveBeenCalledWith({
        method: "groups.getById",
        params: {
          group_ids: "123,club_name,public456,plain",
          fields: "counters,member_status",
        },
      });
    });

    it("getGroupsByLinksOrIds запрашивает по 500 сообществ за раз", async () => {
      addRequestToQueue.mockImplementation(async ({ params }) =>
        params.group_ids.split(",").map((id: string) => ({ id: +id })),
      );

      const groups = await createService().getGroupsByLinksOrIds(range(1, 1201));

      expect(addRequestToQueue).toHaveBeenCalledTimes(3);
      expect(groups).toHaveLength(1200);
    });

    it("getGroupsByLinksOrIds возвращает пустой список при ошибке", async () => {
      addRequestToQueue.mockRejectedValueOnce(createVkErrorLike(15));

      const groups = await createService().getGroupsByLinksOrIds([1]);

      expect(groups).toEqual([]);
    });

    it("getMapGroupsByIds сопоставляет сообщества идентификаторам", async () => {
      addRequestToQueue.mockResolvedValueOnce([{ id: 1, name: "Первое" }]);

      const groups = await createService().getMapGroupsByIds([1, 2]);

      expect(groups).toEqual(
        new Map([
          [1, { id: 1, name: "Первое" }],
          [2, undefined],
        ]),
      );
    });

    it("getMapGroupsByIds возвращает пустую карту при ошибке", async () => {
      addRequestToQueue.mockRejectedValueOnce(createVkErrorLike(15));

      const groups = await createService().getMapGroupsByIds([1]);

      expect(groups.size).toBe(0);
    });
  });

  describe("методы ссылок", () => {
    it("utilsGetShortLink передаёт параметры как есть", async () => {
      addRequestToQueue.mockResolvedValueOnce({ short_url: "vk.cc/a" });

      const result = await createService().utilsGetShortLink({
        private: true,
        url: "https://example.com",
      });

      expect(result).toEqual({ short_url: "vk.cc/a" });
      expect(addRequestToQueue).toHaveBeenCalledWith({
        method: "utils.getShortLink",
        params: { private: true, url: "https://example.com" },
      });
    });

    it("utilsCheckLink передаёт параметры как есть", async () => {
      addRequestToQueue.mockResolvedValueOnce({ link: "https://example.com" });

      await createService().utilsCheckLink({ url: "vk.cc/a" });

      expect(addRequestToQueue).toHaveBeenCalledWith({
        method: "utils.checkLink",
        params: { url: "vk.cc/a" },
      });
    });
  });
});
