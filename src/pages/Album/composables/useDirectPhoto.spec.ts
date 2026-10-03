import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick, ref } from "vue";
import { noop } from "es-toolkit";
import { useDirectPhoto } from "@/pages/Album/composables/useDirectPhoto";
import { IPhoto, IPhotoKey } from "@/store/groups/types";

const { photosGetById } = vi.hoisted(() => ({ photosGetById: vi.fn() }));

vi.mock("@vkontakte/vk-bridge", () => ({ default: {} }));

vi.mock("@/store/vk/vk", () => ({
  useVk: () => ({ getApiService: async () => ({ photosGetById }) }),
}));

const ownerId = -1;

function createPhoto(id: number) {
  return { id, owner_id: ownerId } as IPhoto;
}

function setup(photoId?: number) {
  const currentPhotoId = ref<number | undefined>(photoId);
  const photosMap = ref(new Map<IPhotoKey, IPhoto>());
  const directPhoto = useDirectPhoto(ref(ownerId), currentPhotoId, photosMap);
  return { currentPhotoId, photosMap, directPhoto };
}

describe("useDirectPhoto", () => {
  beforeEach(() => {
    photosGetById.mockReset();
  });

  it("загружает фото из URL со специальным индексом", async () => {
    photosGetById.mockResolvedValueOnce([createPhoto(5)]);
    const { directPhoto } = setup(5);

    await directPhoto.load();

    expect(photosGetById).toHaveBeenCalledWith({ photos: "-1_5" });
    expect(directPhoto.photo.value?.id).toBe(5);
    expect(directPhoto.photo.value?.__state.index).toBe(-1);
    expect(directPhoto.isLoading.value).toBe(false);
  });

  it("ничего не грузит без фото в URL", async () => {
    const { directPhoto } = setup();

    await directPhoto.load();

    expect(photosGetById).not.toHaveBeenCalled();
  });

  it("ничего не грузит, если фото уже в списке", async () => {
    const { photosMap, directPhoto } = setup(5);
    photosMap.value.set("photo-1_5", createPhoto(5));

    await directPhoto.load();

    expect(photosGetById).not.toHaveBeenCalled();
  });

  it("не падает, если фото не найдено или запрос упал", async () => {
    const warn = vi.spyOn(console, "warn").mockImplementation(noop);
    photosGetById
      .mockResolvedValueOnce([])
      .mockRejectedValueOnce(new Error("network"));
    const { directPhoto } = setup(5);

    await directPhoto.load();
    await directPhoto.load();

    expect(directPhoto.photo.value).toBeUndefined();
    expect(directPhoto.isLoading.value).toBe(false);
    warn.mockRestore();
  });

  it("отбрасывает фото, пришедшее после сброса", async () => {
    let resolveStale!: (photos: IPhoto[]) => void;
    photosGetById.mockReturnValueOnce(
      new Promise((resolve) => {
        resolveStale = resolve;
      }),
    );
    const { directPhoto } = setup(5);

    const stale = directPhoto.load();
    directPhoto.reset();
    resolveStale([createPhoto(5)]);
    await stale;

    expect(directPhoto.photo.value).toBeUndefined();
    expect(directPhoto.isLoading.value).toBe(false);
  });

  it("новая загрузка вытесняет предыдущую", async () => {
    let resolveStale!: (photos: IPhoto[]) => void;
    photosGetById
      .mockReturnValueOnce(
        new Promise((resolve) => {
          resolveStale = resolve;
        }),
      )
      .mockResolvedValueOnce([createPhoto(6)]);
    const { currentPhotoId, directPhoto } = setup(5);

    const stale = directPhoto.load();
    currentPhotoId.value = 6;
    await directPhoto.load();
    resolveStale([createPhoto(5)]);
    await stale;

    expect(directPhoto.photo.value?.id).toBe(6);
  });

  it("сбрасывается при переходе к другому фото", async () => {
    photosGetById.mockResolvedValueOnce([createPhoto(5)]);
    const { currentPhotoId, directPhoto } = setup(5);
    await directPhoto.load();

    currentPhotoId.value = 6;
    await nextTick();

    expect(directPhoto.photo.value).toBeUndefined();
  });

  it("сбрасывается, когда фото догрузилось в список", async () => {
    photosGetById.mockResolvedValueOnce([createPhoto(5)]);
    const { photosMap, directPhoto } = setup(5);
    await directPhoto.load();

    photosMap.value.set("photo-1_5", createPhoto(5));
    await nextTick();

    expect(directPhoto.photo.value).toBeUndefined();
  });
});
