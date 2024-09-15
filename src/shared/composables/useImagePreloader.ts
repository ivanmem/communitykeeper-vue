import { MaybeRefOrGetter, ref, toRef, toValue, watch } from "vue";

export interface UseImagePreloaderOpts {
  /** @description После достижения указанного количества - предыдущие значения удаляются. */
  max: MaybeRefOrGetter<number>;
  /** @description При `true` предзагрузка не происходит. */
  freeze?: MaybeRefOrGetter<boolean>;
}

export function useImagePreloader(opts: UseImagePreloaderOpts) {
  const freeze = toRef(() => toValue(opts.freeze));
  const max = toRef(() => toValue(opts.max));
  const photos = ref(new Set<string>());
  const freezePhotos = ref(new Set<string>());

  const preloadPhoto = <T extends string | undefined = string | undefined>(
    photo: T | T[],
  ) => {
    if (photo === undefined) return;
    if (Array.isArray(photo)) {
      for (const p of photo) {
        if (p === undefined) continue;
        preloadPhoto(p);
      }

      return;
    }

    // при заморозке добавляем фото в дополнительную переменную
    const values = freeze.value ? freezePhotos.value : photos.value;
    values.add(photo);
    while (values.size > max.value) {
      values.delete(photos.value.values().next().value!);
    }
  };

  watch(freeze, (freeze) => {
    if (freeze || freezePhotos.value.size === 0) return;
    // при разморозке добавляем фото в главную переменную и очищаем дополнительную
    for (const photo of freezePhotos.value) {
      preloadPhoto(photo);
    }

    freezePhotos.value.clear();
  });

  return {
    photos,
    preloadPhoto,
  };
}
