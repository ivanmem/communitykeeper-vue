import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { effectScope, EffectScope, nextTick, ref, Ref } from "vue";
import { delay, noop, range } from "es-toolkit";
import { VKError } from "vkontakte-api";
import { useAlbum } from "@/pages/Album/useAlbum";
import { IPhoto } from "@/store/groups/types";
import { IAlbumItem } from "@/store/vk/IAlbumItem";

const { api, holder, gallery } = vi.hoisted(() => ({
  api: {
    photosGet: vi.fn(),
    photosGetById: vi.fn(),
    getCachedAlbum: vi.fn(),
  },
  holder: {} as {
    context: {
      ownerId: Ref<number | string>;
      albumId: Ref<number | string>;
      photoId: Ref<number | string | undefined>;
    };
    groupsConfig: { reverseOrder: boolean };
  },
  gallery: {} as Record<string, any>,
}));

vi.mock("@vkontakte/vk-bridge", () => ({ default: {} }));

vi.mock("@/store/vk/vk", () => ({
  useVk: () => ({ getApiService: async () => api }),
}));

vi.mock("@/store/groups/groups", async () => {
  const { reactive } = await import("vue");
  holder.groupsConfig = reactive({ reverseOrder: false });
  return { useGroups: () => ({ config: holder.groupsConfig }) };
});

vi.mock("@/store/history/history", () => ({
  useHistory: () => ({ getViewAlbum: () => undefined }),
}));

vi.mock("@/pages/Album/stores", () => ({
  injectAlbumPageContext: () => holder.context,
  provideAlbumContext: () => {},
}));

vi.mock("@/pages/Albums/consts", () => ({
  AlbumsPreviewSizesInitial: { width: 100, height: 100 },
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

// Прокрутка проверяется в тесте useGalleryInfiniteScroll
vi.mock("@/shared/composables/useGalleryInfiniteScroll", () => ({
  useGalleryInfiniteScroll: () => {},
}));

// Листание фото проверяется отдельно, здесь нужен только его интерфейс
vi.mock("@/pages/Album/useCurrentPhoto", async () => {
  const { computed, ref: vueRef } = await import("vue");
  return {
    useCurrentPhoto: () => ({
      currentPhoto: computed(() => undefined),
      currentPhotoIndex: vueRef<number>(),
      setCurrentPhotoIndex: () => {},
      setCurrentPhotoId: () => {},
      onSwitchPhoto: () => {},
      imagePreloader: {},
    }),
  };
});

// Вместо реального компонента галереи используем грид без DOM
vi.mock("@/shared/composables/useGalleryComponent", async () => {
  const { ref: vueRef } = await import("vue");
  const { useGridArray } = await import("@/shared/composables/useGridArray");

  return {
    useGalleryComponent: () => {
      const columns = vueRef(3);
      const grid = useGridArray(columns);
      Object.assign(gallery, {
        componentRef: vueRef({ scrollToIndex: vi.fn() }),
        albumPhotoRef: vueRef(),
        position: vueRef(0),
        sizes: vueRef({ width: 100, height: 100 }),
        columns,
        grid,
        clear: grid.clear,
      });
      return gallery;
    },
  };
});

function createPhotos(fromId: number, count: number, ownerId = -1) {
  return range(fromId, fromId + count).map(
    (id) => ({ id, owner_id: ownerId }) as IPhoto,
  );
}

function createAlbum(id: number): IAlbumItem {
  return { id, owner_id: -1, size: 300, title: `Альбом ${id}` };
}

function getPhotoIds() {
  return gallery.grid.items.map((photo: IPhoto) => photo.id);
}

let scope: EffectScope;

function setup(albumId: number | string, photoId?: number) {
  holder.context = {
    ownerId: ref(-1),
    albumId: ref(albumId),
    photoId: ref(photoId),
  };
  const album = scope.run(useAlbum)!;
  return { ...holder.context, album };
}

describe("useAlbum: загрузка фото", () => {
  beforeEach(() => {
    scope = effectScope();
    api.photosGet.mockReset();
    api.photosGetById.mockReset();
    api.getCachedAlbum.mockReset().mockResolvedValue(undefined);
    holder.groupsConfig.reverseOrder = false;
  });

  afterEach(() => {
    scope.stop();
  });

  it("загружает фото и информацию об альбоме, wall превращает в -7", async () => {
    api.getCachedAlbum.mockResolvedValueOnce(createAlbum(-7));
    api.photosGet.mockResolvedValueOnce({
      items: createPhotos(1, 3),
      count: 300,
    });
    const { album } = setup("wall");
    await delay(0);

    expect(api.photosGet).toHaveBeenCalledWith(
      expect.objectContaining({ album_id: -7, owner_id: -1, offset: 0 }),
    );
    expect(api.getCachedAlbum).toHaveBeenCalledWith({
      owner_id: -1,
      album_id: -7,
    });
    expect(getPhotoIds()).toEqual([1, 2, 3]);
    expect(album.album.value).toEqual(createAlbum(-7));
    expect(album.albumSize.value).toBe(300);
    expect(album.isInit.value).toBe(true);
  });

  it("при смене альбома отбрасывает данные прошлого", async () => {
    let resolveStalePhotos!: (page: { items: IPhoto[]; count: number }) => void;
    let resolveStaleInfo!: (album: IAlbumItem) => void;
    api.photosGet
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveStalePhotos = resolve;
        }),
      )
      .mockResolvedValueOnce({ items: createPhotos(10, 2), count: 2 });
    api.getCachedAlbum
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveStaleInfo = resolve;
        }),
      )
      .mockResolvedValueOnce(createAlbum(2));
    const { albumId, album } = setup(1);
    await delay(0);

    albumId.value = 2;
    await delay(0);
    resolveStalePhotos({ items: createPhotos(1, 3), count: 300 });
    resolveStaleInfo(createAlbum(1));
    await delay(0);

    expect(getPhotoIds()).toEqual([10, 11]);
    expect(album.album.value).toEqual(createAlbum(2));
    expect(album.albumSize.value).toBe(2);
  });

  it("перезагружает фото при смене порядка", async () => {
    api.photosGet
      .mockResolvedValueOnce({ items: createPhotos(1, 3), count: 3 })
      .mockResolvedValueOnce({ items: createPhotos(3, 3), count: 3 });
    setup(1);
    await delay(0);

    holder.groupsConfig.reverseOrder = true;
    await delay(0);

    expect(api.photosGet).toHaveBeenLastCalledWith(
      expect.objectContaining({ rev: 1, offset: 0 }),
    );
    expect(getPhotoIds()).toEqual([3, 4, 5]);
  });

  describe("фото из URL", () => {
    it("показывает фото, загруженное напрямую, и не грузит весь альбом", async () => {
      api.photosGetById.mockResolvedValueOnce(createPhotos(500, 1));
      api.photosGet.mockResolvedValue({
        items: createPhotos(1, 150),
        count: 1000,
      });
      const { album } = setup(1, 500);
      await delay(0);

      expect(api.photosGetById).toHaveBeenCalledWith({ photos: "-1_500" });
      expect(album.directPhoto.value?.id).toBe(500);
      expect(api.photosGet).toHaveBeenCalledOnce();
    });

    it("догружает альбом, пока не найдёт фото, если напрямую его не получить", async () => {
      api.photosGetById.mockResolvedValueOnce([]);
      api.photosGet
        .mockResolvedValueOnce({ items: createPhotos(1, 150), count: 1000 })
        .mockResolvedValueOnce({ items: createPhotos(151, 150), count: 1000 });
      setup(1, 200);
      await delay(0);
      await delay(0);

      expect(api.photosGet).toHaveBeenCalledTimes(2);
      expect(gallery.componentRef.value.scrollToIndex).toHaveBeenCalledWith(
        Math.floor(199 / 3),
      );
    });

    it("прокручивает к фото, которое уже есть в списке", async () => {
      api.photosGet.mockResolvedValueOnce({
        items: createPhotos(1, 3),
        count: 3,
      });
      const { photoId } = setup(1);
      await delay(0);

      photoId.value = 3;
      await nextTick();

      expect(api.photosGetById).not.toHaveBeenCalled();
      expect(gallery.componentRef.value.scrollToIndex).toHaveBeenCalledWith(0);
    });
  });

  describe("ошибки", () => {
    it("показывает ошибку загрузки фото и сбрасывает её при смене альбома", async () => {
      vi.spyOn(console, "warn").mockImplementation(noop);
      api.photosGet
        .mockRejectedValueOnce(new Error("network"))
        .mockResolvedValueOnce({ items: createPhotos(1, 2), count: 2 });
      const { albumId, album } = setup(1);
      await delay(0);

      expect(album.screenError.value).toBeTruthy();

      albumId.value = 2;
      await delay(0);

      expect(album.screenError.value).toBeUndefined();
      vi.mocked(console.warn).mockRestore();
    });

    it("показывает ошибку получения информации об альбоме", async () => {
      vi.spyOn(console, "warn").mockImplementation(noop);
      api.getCachedAlbum.mockRejectedValueOnce(
        new VKError({
          errorInfo: { error_code: 10, error_msg: "Internal error", request_params: [] },
          config: { method: "photos.getAlbums", params: {} },
        }),
      );
      api.photosGet.mockResolvedValueOnce({
        items: createPhotos(1, 2),
        count: 2,
      });
      const { album } = setup(1);
      await delay(0);

      expect(album.screenError.value).toBeTruthy();
      vi.mocked(console.warn).mockRestore();
    });
  });
});
