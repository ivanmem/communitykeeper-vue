import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { effectScope, EffectScope, ref } from "vue";
import { VKError } from "vkontakte-api";
import { delay, noop, range } from "es-toolkit";
import { useAlbums } from "@/pages/Albums/useAlbums";
import { IAlbumItem } from "@/store/vk/IAlbumItem";
import { IGroup } from "@/store/groups/types";

const { api, getGroupByIdOrLoad, gallery } = vi.hoisted(() => ({
  api: {
    getAlbums: vi.fn(),
    createAlbumItem: vi.fn(),
  },
  getGroupByIdOrLoad: vi.fn(),
  gallery: {} as Record<string, any>,
}));

vi.mock("@vkontakte/vk-bridge", () => ({ default: {} }));

vi.mock("@/store/vk/vk", () => ({
  useVk: () => ({ getApiService: async () => api }),
}));

vi.mock("@/store/groups/groups", () => ({
  useGroups: () => ({ getGroupByIdOrLoad }),
}));

vi.mock("@/store/app/app", () => ({
  useApp: () => ({
    wrapLoading:
      <T>(action: () => T) =>
      async () =>
        await action(),
  }),
}));

vi.mock("@/shared/constants/consts", () => ({
  VK_ERROR_CODE: { accessDenied: 15 },
}));

vi.mock("@/pages/Albums/consts", () => ({
  AlbumsPreviewSizesInitial: { width: 100, height: 100 },
  wallAlbumStatic: { title: "Стена", id: -7 },
  getStaticAlbums: (ownerId: number | string) => [
    { id: -7, title: "Стена", size: "?", owner_id: +ownerId },
  ],
}));

vi.mock("@/shared/composables/useScreenSpinner", () => ({
  useScreenSpinner: () => {},
}));

vi.mock("@/shared/composables/useScrollRestore", () => ({
  useScrollRestore: () => ({ setLastScrollTop: () => {} }),
}));

vi.mock("@/shared/composables/useImagePreloader", () => ({
  useImagePreloader: () => ({ preloadPhoto: () => {} }),
}));

// Вместо реального компонента галереи используем грид без DOM
vi.mock("@/shared/composables/useGalleryComponent", async () => {
  const { ref: vueRef } = await import("vue");
  const { useGridArray } = await import("@/shared/composables/useGridArray");

  return {
    useGalleryComponent: () => {
      const columns = vueRef(4);
      const grid = useGridArray(columns);
      Object.assign(gallery, {
        componentRef: vueRef<object | undefined>(),
        endIndex: vueRef(0),
        sizes: vueRef({ width: 100, height: 100 }),
        columns,
        grid,
        clear: grid.clear,
      });
      return gallery;
    },
  };
});

function createAlbums(fromId: number, count: number, ownerId = 1) {
  return range(fromId, fromId + count).map(
    (id): IAlbumItem => ({
      id,
      owner_id: ownerId,
      size: 1,
      title: `Альбом ${id}`,
    }),
  );
}

function createWallAlbum(ownerId: number): IAlbumItem {
  return { id: -7, owner_id: ownerId, size: 10, title: "Стена" };
}

function createVkError(errorCode: number, message: string) {
  return new VKError({
    errorInfo: { error_code: errorCode, error_msg: message, request_params: [] },
    config: { method: "photos.getAlbums", params: {} },
  });
}

let scope: EffectScope;

function setup(ownerId: number | string) {
  const owner = ref(ownerId);
  const albums = scope.run(() => useAlbums(owner))!;
  return { owner, albums };
}

function getAlbumIds() {
  return gallery.grid.items.map((album: IAlbumItem) => album.id);
}

describe("useAlbums: пагинация", () => {
  beforeEach(() => {
    scope = effectScope();
    api.getAlbums.mockReset();
    api.createAlbumItem.mockReset();
    getGroupByIdOrLoad.mockReset();
  });

  afterEach(() => {
    scope.stop();
  });

  describe("пользователь", () => {
    it("загружает первую порцию без статических альбомов", async () => {
      api.getAlbums.mockResolvedValueOnce({
        items: createAlbums(1, 100),
        count: 250,
      });
      const { albums } = setup(1);
      await delay(0);

      expect(api.getAlbums).toHaveBeenCalledOnce();
      expect(api.getAlbums).toHaveBeenCalledWith({
        owner_id: 1,
        offset: 0,
        count: 100,
      });
      expect(gallery.grid.items).toHaveLength(100);
      expect(albums.isInit.value).toBe(true);
      expect(albums.isAllLoaded.value).toBe(false);
    });

    it("считает всё загруженным на неполной порции", async () => {
      api.getAlbums.mockResolvedValueOnce({
        items: createAlbums(1, 5),
        count: 5,
      });
      const { albums } = setup(1);
      await delay(0);

      expect(albums.isAllLoaded.value).toBe(true);
    });

    it("не считает всё загруженным до первого ответа", () => {
      api.getAlbums.mockReturnValue(new Promise(() => {}));
      const { albums } = setup(1);

      expect(albums.isAllLoaded.value).toBe(false);
      expect(albums.isInit.value).toBe(false);
    });
  });

  describe("сообщество", () => {
    it("добавляет альбом стены первым, не сдвигая смещение", async () => {
      getGroupByIdOrLoad.mockResolvedValueOnce({ id: 5 } as IGroup);
      api.createAlbumItem.mockResolvedValueOnce(createWallAlbum(-5));
      api.getAlbums.mockResolvedValueOnce({
        items: createAlbums(1, 3, -5),
        count: 3,
      });
      const { albums } = setup(-5);
      await delay(0);

      expect(getGroupByIdOrLoad).toHaveBeenCalledWith(5);
      expect(api.createAlbumItem).toHaveBeenCalledWith({
        title: "Стена",
        album_id: -7,
        owner_id: -5,
      });
      expect(api.getAlbums).toHaveBeenCalledWith({
        owner_id: -5,
        offset: 0,
        count: 100,
      });
      expect(getAlbumIds()).toEqual([-7, 1, 2, 3]);
      expect(albums.group.value).toEqual({ id: 5 });
      expect(albums.isAllLoaded.value).toBe(true);
    });

    it("подставляет статические альбомы, если альбом стены не получен", async () => {
      getGroupByIdOrLoad.mockRejectedValueOnce(new Error("group"));
      api.createAlbumItem.mockRejectedValueOnce(new Error("network"));
      api.getAlbums.mockResolvedValueOnce({
        items: createAlbums(1, 2, -5),
        count: 2,
      });
      const { albums } = setup(-5);
      await delay(0);

      expect(getAlbumIds()).toEqual([-7, 1, 2]);
      expect(albums.group.value).toBeUndefined();
      expect(albums.screenError.value).toBeUndefined();
    });

    it("показывает ошибку экрана для заблокированного сообщества", async () => {
      getGroupByIdOrLoad.mockResolvedValueOnce(undefined);
      api.createAlbumItem.mockRejectedValueOnce(
        createVkError(15, "Access denied: id blocked"),
      );
      api.getAlbums.mockRejectedValueOnce(createVkError(15, "Access denied"));
      const { albums } = setup(-5);
      await delay(0);

      expect(albums.screenError.value).toBeTruthy();
      expect(albums.isInit.value).toBe(true);
      expect(gallery.grid.items).toHaveLength(0);
    });
  });

  describe("подгрузка при прокрутке", () => {
    async function setupLoaded() {
      api.getAlbums.mockResolvedValueOnce({
        items: createAlbums(1, 100),
        count: 250,
      });
      const result = setup(1);
      await delay(0);
      gallery.componentRef.value = {};
      return result;
    }

    it("ничего не грузит без компонента списка", async () => {
      api.getAlbums.mockResolvedValueOnce({
        items: createAlbums(1, 100),
        count: 250,
      });
      const { albums } = setup(1);
      await delay(0);
      gallery.endIndex.value = 99;

      albums.onScrollerUpdate();
      await delay(0);

      expect(api.getAlbums).toHaveBeenCalledOnce();
    });

    it("ничего не грузит, пока до конца далеко", async () => {
      const { albums } = await setupLoaded();
      gallery.endIndex.value = 10;

      albums.onScrollerUpdate();
      await delay(0);

      expect(api.getAlbums).toHaveBeenCalledOnce();
    });

    it("грузит следующую порцию со смещением по полученным альбомам", async () => {
      const { albums } = await setupLoaded();
      api.getAlbums.mockResolvedValueOnce({
        items: createAlbums(101, 100),
        count: 250,
      });
      gallery.endIndex.value = 80;

      albums.onScrollerUpdate();
      await delay(0);

      expect(api.getAlbums).toHaveBeenLastCalledWith({
        owner_id: 1,
        offset: 100,
        count: 100,
      });
      expect(gallery.grid.items).toHaveLength(200);
    });

    it("не дублирует запрос при частых событиях прокрутки", async () => {
      const { albums } = await setupLoaded();
      api.getAlbums.mockResolvedValueOnce({
        items: createAlbums(101, 100),
        count: 250,
      });
      gallery.endIndex.value = 80;

      albums.onScrollerUpdate();
      albums.onScrollerUpdate();
      await delay(0);

      expect(api.getAlbums).toHaveBeenCalledTimes(2);
    });
  });

  describe("ошибки порции", () => {
    it("считает альбомы загруженными при ошибке доступа", async () => {
      api.getAlbums.mockRejectedValueOnce(createVkError(15, "Access denied"));
      const { albums } = setup(1);
      await delay(0);

      expect(albums.screenError.value).toBeUndefined();
      expect(albums.isInit.value).toBe(true);
      expect(albums.isAllLoaded.value).toBe(true);
    });

    it("показывает остальные ошибки", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(noop);
      api.getAlbums.mockRejectedValueOnce(createVkError(10, "Internal error"));
      const { albums } = setup(1);
      await delay(0);

      expect(albums.screenError.value).toBeTruthy();
      expect(albums.isInit.value).toBe(true);
      warn.mockRestore();
    });
  });

  describe("loadAllAlbums", () => {
    it("грузит порции до конца", async () => {
      api.getAlbums
        .mockResolvedValueOnce({ items: createAlbums(1, 100), count: 230 })
        .mockResolvedValueOnce({ items: createAlbums(101, 100), count: 230 })
        .mockResolvedValueOnce({ items: createAlbums(201, 30), count: 230 });
      const { albums } = setup(1);
      await delay(0);

      await albums.loadAllAlbums();

      expect(api.getAlbums).toHaveBeenCalledTimes(3);
      expect(api.getAlbums).toHaveBeenLastCalledWith({
        owner_id: 1,
        offset: 200,
        count: 100,
      });
      expect(albums.isAllLoaded.value).toBe(true);
    });

    it("ждёт уже идущую загрузку, а не запускает новую", async () => {
      let resolveFirst!: (page: { items: IAlbumItem[]; count: number }) => void;
      api.getAlbums
        .mockReturnValueOnce(
          new Promise((resolve) => {
            resolveFirst = resolve;
          }),
        )
        .mockResolvedValueOnce({ items: createAlbums(101, 10), count: 110 });
      const { albums } = setup(1);
      await delay(0);

      const loading = albums.loadAllAlbums();
      resolveFirst({ items: createAlbums(1, 100), count: 110 });
      await loading;

      expect(api.getAlbums).toHaveBeenCalledTimes(2);
      expect(gallery.grid.items).toHaveLength(110);
    });

    it("ничего не делает, когда всё загружено", async () => {
      api.getAlbums.mockResolvedValueOnce({
        items: createAlbums(1, 5),
        count: 5,
      });
      const { albums } = setup(1);
      await delay(0);

      await albums.loadAllAlbums();

      expect(api.getAlbums).toHaveBeenCalledOnce();
    });

    it("останавливается на ошибке, а не повторяет запрос бесконечно", async () => {
      const warn = vi.spyOn(console, "warn").mockImplementation(noop);
      api.getAlbums
        .mockResolvedValueOnce({ items: createAlbums(1, 100), count: 300 })
        .mockRejectedValue(new Error("network"));
      const { albums } = setup(1);
      await delay(0);

      await albums.loadAllAlbums();

      expect(api.getAlbums).toHaveBeenCalledTimes(2);
      expect(albums.screenError.value).toBeTruthy();
      warn.mockRestore();
    });
  });

  describe("смена владельца", () => {
    it("начинает заново при смене пользователя", async () => {
      api.getAlbums
        .mockResolvedValueOnce({ items: createAlbums(1, 5), count: 5 })
        .mockResolvedValueOnce({ items: createAlbums(50, 2, 2), count: 2 });
      const { owner } = setup(1);
      await delay(0);

      owner.value = 2;
      await delay(0);

      expect(api.getAlbums).toHaveBeenLastCalledWith({
        owner_id: 2,
        offset: 0,
        count: 100,
      });
      expect(getAlbumIds()).toEqual([50, 51]);
    });

    it("начинает заново при смене сообщества", async () => {
      getGroupByIdOrLoad.mockResolvedValue(undefined);
      api.createAlbumItem
        .mockResolvedValueOnce(createWallAlbum(-1))
        .mockResolvedValueOnce(createWallAlbum(-2));
      api.getAlbums
        .mockResolvedValueOnce({ items: createAlbums(1, 5, -1), count: 5 })
        .mockResolvedValueOnce({ items: createAlbums(50, 2, -2), count: 2 });
      const { owner } = setup(-1);
      await delay(0);

      owner.value = -2;
      await delay(0);

      expect(gallery.grid.items.map((album: IAlbumItem) => album.owner_id))
        .toEqual([-2, -2, -2]);
    });

    it("отбрасывает альбомы предыдущего владельца, пришедшие после смены", async () => {
      let resolveStale!: (page: { items: IAlbumItem[]; count: number }) => void;
      api.getAlbums
        .mockReturnValueOnce(
          new Promise((resolve) => {
            resolveStale = resolve;
          }),
        )
        .mockResolvedValueOnce({ items: createAlbums(50, 2, 2), count: 2 });
      const { owner, albums } = setup(1);
      await delay(0);

      owner.value = 2;
      await delay(0);
      resolveStale({ items: createAlbums(1, 5), count: 5 });
      await delay(0);

      expect(getAlbumIds()).toEqual([50, 51]);
      expect(albums.isAllLoaded.value).toBe(true);
    });

    it("отбрасывает альбом стены предыдущего сообщества", async () => {
      let resolveStaleWall!: (album: IAlbumItem) => void;
      getGroupByIdOrLoad.mockResolvedValue(undefined);
      api.createAlbumItem
        .mockReturnValueOnce(
          new Promise((resolve) => {
            resolveStaleWall = resolve;
          }),
        )
        .mockResolvedValueOnce(createWallAlbum(-2));
      api.getAlbums.mockResolvedValue({
        items: createAlbums(50, 2, -2),
        count: 2,
      });
      const { owner } = setup(-1);
      await delay(0);

      owner.value = -2;
      await delay(0);
      resolveStaleWall(createWallAlbum(-1));
      await delay(0);

      expect(gallery.grid.items.map((album: IAlbumItem) => album.owner_id))
        .toEqual([-2, -2, -2]);
      expect(api.getAlbums).toHaveBeenCalledOnce();
    });
  });
});
