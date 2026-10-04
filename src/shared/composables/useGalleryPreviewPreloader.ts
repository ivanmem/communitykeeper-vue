import { MaybeRefOrGetter, watch } from "vue";
import { IPhotoSize } from "vkontakte-api";
import { PhotoHelper } from "@/shared/helpers/PhotoHelper";
import { useImagePreloader } from "@/shared/composables/useImagePreloader";
import { useGalleryComponent } from "@/shared/composables/useGalleryComponent";

// Сколько строк миниатюр ниже экрана загружаем заранее
const preloadRows = 3;

/** @description Заранее загружает миниатюры строк, которые идут сразу под видимой областью списка */
export function useGalleryPreviewPreloader<T extends { sizes?: IPhotoSize[] }>(
  {
    grid,
    columns,
    position,
    sizes,
  }: Pick<
    ReturnType<typeof useGalleryComponent<T>>,
    "grid" | "columns" | "position" | "sizes"
  >,
  freeze?: MaybeRefOrGetter<boolean>,
) {
  const previewPreloader = useImagePreloader({
    // Храним две партии, чтобы новая не вытесняла ещё не загруженную предыдущую
    max: () => columns.value * preloadRows * 2,
    freeze,
  });

  watch(position, preloadNextRows);

  function preloadNextRows(newPosition: number, prevPosition: number) {
    // Наперёд грузим только при прокрутке вниз или появлении новых элементов
    if (Number.isNaN(newPosition) || newPosition <= prevPosition) {
      return;
    }

    previewPreloader.preloadPhoto(
      grid.items
        .slice(newPosition, newPosition + columns.value * preloadRows)
        .map((item) => PhotoHelper.getPreviewSize(item.sizes, sizes.value)?.url),
    );
  }

  return previewPreloader;
}
