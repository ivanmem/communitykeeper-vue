import { Ref, watch } from "vue";
import type { VListHandle } from "virtua/vue";
import { IPhoto } from "@/store/groups/types";
import { useGalleryComponent } from "@/shared/composables/useGalleryComponent";
import { useOffsetPagination } from "@/shared/composables/useOffsetPagination";

/**
 * @description Связывает открытое фото со списком альбома.
 * Пока фото открыто, список скрыт: подгрузка при прокрутке не работает,
 * поэтому порции подгружаются по мере листания, а после закрытия список возвращается к фото.
 */
export function useOpenedPhotoSync(
  currentPhotoIndex: Readonly<Ref<number | undefined>>,
  {
    componentRef,
    columns,
    grid,
  }: {
    componentRef: Readonly<Ref<Pick<VListHandle, "scrollToIndex"> | undefined>>;
  } & Pick<ReturnType<typeof useGalleryComponent<IPhoto>>, "columns" | "grid">,
  { loadNext }: Pick<ReturnType<typeof useOffsetPagination>, "loadNext">,
  // За сколько фото до конца списка начинаем грузить следующую порцию
  loadAheadCount: number,
) {
  // После закрытия фото список должен быть уже показан, чтобы его можно было прокрутить
  watch(currentPhotoIndex, onCurrentPhotoIndexChange, { flush: "post" });

  function onCurrentPhotoIndexChange(
    index: number | undefined,
    prevIndex: number | undefined,
  ) {
    if (index === undefined) {
      scrollToClosedPhoto(prevIndex);
      return;
    }

    // Индекс -1 у фото, открытого по ссылке вне списка
    if (index >= 0 && index + loadAheadCount >= grid.items.length) {
      // Отладочный лог: в прод-сборку не попадает
      if (import.meta.env.DEV) {
        console.log("[Альбом] открытое фото близко к концу списка", {
          index,
          loaded: grid.items.length,
        });
      }

      loadNext();
    }
  }

  function scrollToClosedPhoto(index: number | undefined) {
    if (index === undefined || index < 0) {
      return;
    }

    const row = Math.floor(index / columns.value);
    if (import.meta.env.DEV) {
      console.log("[Альбом] фото закрыто, прокрутка списка к нему", {
        index,
        row,
      });
    }

    componentRef.value?.scrollToIndex(row);
  }
}
