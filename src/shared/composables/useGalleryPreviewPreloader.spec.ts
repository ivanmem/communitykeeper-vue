import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { computed, nextTick, ref } from "vue";
import { range } from "es-toolkit";
import { useGalleryPreviewPreloader } from "@/shared/composables/useGalleryPreviewPreloader";
import { useGridArray } from "@/shared/composables/useGridArray";
import { IAlbumItem } from "@/store/vk/IAlbumItem";

vi.mock("@vkontakte/vk-bridge", () => ({ default: {} }));

const columns = 4;

function createAlbum(id: number): IAlbumItem {
  return {
    id,
    owner_id: 1,
    size: 1,
    title: `Альбом ${id}`,
    sizes: [{ type: "x", url: `preview${id}`, width: 100, height: 100 }],
  };
}

function setup(freeze = ref(false)) {
  const grid = useGridArray<IAlbumItem>(ref(columns));
  grid.push(...range(0, 40).map(createAlbum));
  const position = ref(0);
  const preloader = useGalleryPreviewPreloader(
    {
      grid,
      columns: ref(columns),
      position: computed(() => position.value),
      sizes: ref({ width: 100, height: 100 }),
    },
    freeze,
  );
  return { position, preloader };
}

describe("useGalleryPreviewPreloader", () => {
  beforeEach(() => {
    vi.stubGlobal("window", { devicePixelRatio: 1 });
  });

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it("загружает три строки миниатюр под видимой областью", async () => {
    const { position, preloader } = setup();

    position.value = 8;
    await nextTick();

    expect([...preloader.photos.value]).toEqual(
      range(8, 20).map((id) => `preview${id}`),
    );
  });

  it("не грузит при прокрутке вверх", async () => {
    const { position, preloader } = setup();
    position.value = 20;
    await nextTick();
    preloader.photos.value.clear();

    position.value = 12;
    await nextTick();

    expect(preloader.photos.value.size).toBe(0);
  });

  it("хранит не больше двух партий, вытесняя самые старые", async () => {
    const { position, preloader } = setup();

    for (const value of [4, 16, 28]) {
      position.value = value;
      await nextTick();
    }

    expect(preloader.photos.value.size).toBe(columns * 3 * 2);
    expect(preloader.photos.value.has("preview4")).toBe(false);
    expect(preloader.photos.value.has("preview39")).toBe(true);
  });

  it("не грузит, пока предзагрузка заморожена", async () => {
    const { position, preloader } = setup(ref(true));

    position.value = 8;
    await nextTick();

    expect(preloader.photos.value.size).toBe(0);
  });
});
