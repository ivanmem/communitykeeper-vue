import { beforeEach, describe, expect, it, vi } from "vitest";
import { ref } from "vue";
import { noop, range } from "es-toolkit";
import { useAlbumPagination } from "@/pages/Album/composables/useAlbumPagination";
import { useGridArray } from "@/shared/composables/useGridArray";
import { IPhoto, IPhotoKey } from "@/store/groups/types";

const { photosGet, groupsConfig } = vi.hoisted(() => ({
  photosGet: vi.fn(),
  groupsConfig: { reverseOrder: false },
}));

vi.mock("@vkontakte/vk-bridge", () => ({ default: {} }));

vi.mock("@/store/vk/vk", () => ({
  useVk: () => ({
    getApiService: async () => ({ photosGet }),
  }),
}));

vi.mock("@/store/groups/groups", () => ({
  useGroups: () => ({ config: groupsConfig }),
}));

const ownerId = -1;
const albumId = 10;

function createPhoto(id: number) {
  return { id, owner_id: ownerId } as IPhoto;
}

function createPhotos(fromId: number, count: number) {
  return range(fromId, fromId + count).map(createPhoto);
}

function setup(countOneLoad = 3) {
  const galleryGrid = useGridArray<IPhoto>(ref(3));
  const photosMap = new Map<IPhotoKey, IPhoto>();
  const pagination = useAlbumPagination({
    ownerId,
    albumId,
    galleryGrid,
    photosMap,
    countOneLoad,
  });

  return { galleryGrid, photosMap, pagination };
}

describe("useAlbumPagination", () => {
  beforeEach(() => {
    photosGet.mockReset();
    groupsConfig.reverseOrder = false;
  });

  it("загружает первую порцию с нулевым смещением", async () => {
    photosGet.mockResolvedValueOnce({ items: createPhotos(1, 3), count: 10 });
    const { galleryGrid, photosMap, pagination } = setup();

    await pagination.loadNext();

    expect(photosGet).toHaveBeenCalledWith({
      album_id: albumId,
      owner_id: ownerId,
      offset: 0,
      count: 3,
      rev: 0,
      extended: 1,
      photo_sizes: 1,
    });
    expect(galleryGrid.items.map((photo) => photo.id)).toEqual([1, 2, 3]);
    expect(photosMap.has(`photo${ownerId}_2`)).toBe(true);
    expect(pagination.totalCount.value).toBe(10);
    expect(pagination.isInit.value).toBe(true);
    expect(pagination.isLoading.value).toBe(false);
    expect(pagination.isAllLoaded.value).toBe(false);
  });

  it("проставляет фото порядковые индексы в гриде", async () => {
    photosGet
      .mockResolvedValueOnce({ items: createPhotos(1, 3), count: 10 })
      .mockResolvedValueOnce({ items: createPhotos(4, 3), count: 10 });
    const { galleryGrid, pagination } = setup();

    await pagination.loadNext();
    await pagination.loadNext();

    expect(galleryGrid.items.map((photo) => photo.__state.index)).toEqual([
      0, 1, 2, 3, 4, 5,
    ]);
  });

  it("запрашивает следующую порцию со смещением по количеству загруженных фото", async () => {
    photosGet
      .mockResolvedValueOnce({ items: createPhotos(1, 3), count: 10 })
      .mockResolvedValueOnce({ items: createPhotos(4, 3), count: 10 });
    const { pagination } = setup();

    await pagination.loadNext();
    await pagination.loadNext();

    expect(photosGet).toHaveBeenLastCalledWith(
      expect.objectContaining({ offset: 3, count: 3 }),
    );
  });

  it("передаёт rev = 1 при обратном порядке", async () => {
    groupsConfig.reverseOrder = true;
    photosGet.mockResolvedValueOnce({ items: [], count: 0 });
    const { pagination } = setup();

    await pagination.loadNext();

    expect(photosGet).toHaveBeenCalledWith(expect.objectContaining({ rev: 1 }));
  });

  it("берёт актуальные ownerId и albumId из геттеров", async () => {
    photosGet.mockResolvedValue({ items: [], count: 0 });
    const currentAlbumId = ref(1);
    const pagination = useAlbumPagination({
      ownerId: () => 5,
      albumId: currentAlbumId,
      galleryGrid: useGridArray<IPhoto>(ref(3)),
      photosMap: new Map(),
    });

    currentAlbumId.value = 2;
    await pagination.loadNext();

    expect(photosGet).toHaveBeenCalledWith(
      expect.objectContaining({ owner_id: 5, album_id: 2, count: 150 }),
    );
  });

  it("считает альбом загруженным, когда пришло меньше фото, чем запрошено", async () => {
    photosGet.mockResolvedValueOnce({ items: createPhotos(1, 2), count: 2 });
    const { galleryGrid, pagination } = setup();

    await pagination.loadNext();
    await pagination.loadNext();

    expect(pagination.isAllLoaded.value).toBe(true);
    expect(galleryGrid.items).toHaveLength(2);
    expect(photosGet).toHaveBeenCalledTimes(1);
  });

  it("считает альбом загруженным, когда пришёл пустой ответ", async () => {
    photosGet
      // Общее количество устарело: фото удалили между запросами
      .mockResolvedValueOnce({ items: createPhotos(1, 3), count: 6 })
      .mockResolvedValueOnce({ items: [], count: 6 });
    const { pagination } = setup();

    await pagination.loadNext();
    expect(pagination.isAllLoaded.value).toBe(false);

    await pagination.loadNext();
    expect(pagination.isAllLoaded.value).toBe(true);
  });

  it("пропускает дубликаты, которые вернул API из-за смещения", async () => {
    photosGet
      .mockResolvedValueOnce({ items: createPhotos(1, 3), count: 10 })
      .mockResolvedValueOnce({ items: createPhotos(3, 3), count: 10 });
    const { galleryGrid, photosMap, pagination } = setup();

    await pagination.loadNext();
    await pagination.loadNext();

    expect(galleryGrid.items.map((photo) => photo.id)).toEqual([1, 2, 3, 4, 5]);
    expect(galleryGrid.items.map((photo) => photo.__state.index)).toEqual([
      0, 1, 2, 3, 4,
    ]);
    expect(photosMap.size).toBe(5);
  });

  it("не застревает, когда вся порция состоит из дублей", async () => {
    photosGet
      .mockResolvedValueOnce({ items: createPhotos(1, 3), count: 10 })
      .mockResolvedValueOnce({ items: createPhotos(1, 3), count: 10 })
      .mockResolvedValueOnce({ items: createPhotos(4, 3), count: 10 });
    const { galleryGrid, pagination } = setup();

    await pagination.loadNext();
    await pagination.loadNext();
    await pagination.loadNext();

    // Смещение идёт по ответам сервера, а не по количеству показанных фото
    expect(photosGet).toHaveBeenLastCalledWith(
      expect.objectContaining({ offset: 6 }),
    );
    expect(galleryGrid.items.map((photo) => photo.id)).toEqual([
      1, 2, 3, 4, 5, 6,
    ]);
  });

  it("не добавляет фото прошлого альбома после сброса", async () => {
    let resolveStale!: (page: { items: IPhoto[]; count: number }) => void;
    photosGet
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveStale = resolve;
        }),
      )
      .mockResolvedValueOnce({ items: createPhotos(10, 2), count: 2 });
    const { galleryGrid, pagination } = setup();

    const stale = pagination.loadNext();
    pagination.reset();
    await pagination.loadNext();
    resolveStale({ items: createPhotos(1, 3), count: 10 });
    await stale;

    expect(galleryGrid.items.map((photo) => photo.id)).toEqual([10, 11]);
  });

  it("не запускает параллельную загрузку, пока идёт текущая", async () => {
    photosGet.mockResolvedValue({ items: createPhotos(1, 3), count: 10 });
    const { pagination } = setup();

    await Promise.all([pagination.loadNext(), pagination.loadNext()]);

    expect(photosGet).toHaveBeenCalledTimes(1);
  });

  it("сохраняет ошибку загрузки и снимает флаг загрузки", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(noop);
    photosGet.mockRejectedValueOnce(new Error("network"));
    const { galleryGrid, pagination } = setup();

    await pagination.loadNext();

    expect(pagination.error.value).toBeTruthy();
    expect(pagination.isInit.value).toBe(true);
    expect(pagination.isLoading.value).toBe(false);
    expect(pagination.isAllLoaded.value).toBe(false);
    expect(galleryGrid.items).toHaveLength(0);
    expect(warn).toHaveBeenCalled();
    warn.mockRestore();
  });

  it("сбрасывает ошибку при следующей успешной загрузке", async () => {
    vi.spyOn(console, "warn").mockImplementation(noop);
    photosGet
      .mockRejectedValueOnce(new Error("network"))
      .mockResolvedValueOnce({ items: createPhotos(1, 3), count: 10 });
    const { pagination } = setup();

    await pagination.loadNext();
    await pagination.loadNext();

    expect(pagination.error.value).toBeUndefined();
    vi.mocked(console.warn).mockRestore();
  });

  it("сбрасывает состояние и данные", async () => {
    photosGet
      .mockResolvedValueOnce({ items: createPhotos(1, 2), count: 2 })
      .mockResolvedValueOnce({ items: createPhotos(1, 2), count: 2 });
    const { galleryGrid, photosMap, pagination } = setup();

    await pagination.loadNext();
    pagination.reset();

    expect(galleryGrid.items).toHaveLength(0);
    expect(photosMap.size).toBe(0);
    expect(pagination.isAllLoaded.value).toBe(false);
    expect(pagination.isInit.value).toBe(false);
    expect(pagination.totalCount.value).toBeUndefined();

    await pagination.loadNext();

    expect(photosGet).toHaveBeenLastCalledWith(
      expect.objectContaining({ offset: 0 }),
    );
    expect(galleryGrid.items).toHaveLength(2);
  });
});
