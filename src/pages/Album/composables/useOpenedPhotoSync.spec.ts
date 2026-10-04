import { beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick, ref } from "vue";
import { noop, range } from "es-toolkit";
import { useOpenedPhotoSync } from "@/pages/Album/composables/useOpenedPhotoSync";
import { useGridArray } from "@/shared/composables/useGridArray";
import { IPhoto } from "@/store/groups/types";

const columns = 3;

function setup(loadedCount: number) {
  const currentPhotoIndex = ref<number>();
  const grid = useGridArray<IPhoto>(ref(columns));
  grid.push(...range(0, loadedCount).map((id) => ({ id, owner_id: -1 }) as IPhoto));
  const scrollToIndex = vi.fn();
  const loadNext = vi.fn(async () => {});

  useOpenedPhotoSync(
    currentPhotoIndex,
    {
      componentRef: ref({ scrollToIndex }),
      columns: ref(columns),
      grid,
    },
    { loadNext },
    50,
  );

  return { currentPhotoIndex, scrollToIndex, loadNext };
}

describe("useOpenedPhotoSync", () => {
  beforeEach(() => {
    vi.spyOn(console, "log").mockImplementation(noop);
  });

  it("подгружает следующую порцию, когда открытое фото близко к концу списка", async () => {
    const { currentPhotoIndex, loadNext } = setup(150);

    currentPhotoIndex.value = 100;
    await nextTick();

    expect(loadNext).toHaveBeenCalledOnce();
  });

  it("не подгружает, пока до конца списка далеко", async () => {
    const { currentPhotoIndex, loadNext } = setup(150);

    currentPhotoIndex.value = 99;
    await nextTick();

    expect(loadNext).not.toHaveBeenCalled();
  });

  it("не подгружает для фото, открытого по ссылке вне списка", async () => {
    const { currentPhotoIndex, loadNext } = setup(10);

    currentPhotoIndex.value = -1;
    await nextTick();

    expect(loadNext).not.toHaveBeenCalled();
  });

  it("после закрытия фото прокручивает список к его строке", async () => {
    const { currentPhotoIndex, scrollToIndex } = setup(150);
    currentPhotoIndex.value = 10;
    await nextTick();

    currentPhotoIndex.value = undefined;
    await nextTick();

    expect(scrollToIndex).toHaveBeenCalledWith(3);
  });

  it("не прокручивает после закрытия фото, открытого по ссылке вне списка", async () => {
    const { currentPhotoIndex, scrollToIndex } = setup(10);
    currentPhotoIndex.value = -1;
    await nextTick();

    currentPhotoIndex.value = undefined;
    await nextTick();

    expect(scrollToIndex).not.toHaveBeenCalled();
  });
});
