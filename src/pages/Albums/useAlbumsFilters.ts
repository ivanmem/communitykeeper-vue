import { computed, MaybeRefOrGetter, reactive, Ref, ref, toValue } from "vue";
import type { IAlbumItem } from "@/store/vk/IAlbumItem";
import { useGridIndexes } from "@/shared/composables/useGridIndexes";
import { toNumber } from "es-toolkit/compat";

export enum AlbumsSortEnum {
  date = "date",
  size = "size",
  created = "created",
  updated = "updated",
}

export interface AlbumsFilters {
  search: string;
  sort: AlbumsSortEnum;
  sortDesc: boolean;
}

export interface UseAlbumsFiltersOptions {
  albums: MaybeRefOrGetter<IAlbumItem[]>;
  isAllLoaded: MaybeRefOrGetter<boolean>;
  columns: Ref<number>;
  filters?: AlbumsFilters;
}

export interface UseAlbumsFiltersResult {
  filters: AlbumsFilters;
  showFilters: Ref<boolean>;
  filteredAlbums: Ref<IAlbumItem[]>;
  filteredIndexes: Ref<ReadonlyArray<ReadonlyArray<number>>>;
  needsAllLoaded: Ref<boolean>;
}

export function useAlbumsFilters(
  options: UseAlbumsFiltersOptions,
): UseAlbumsFiltersResult {
  const showFilters = ref(false);

  const filters =
    options.filters ??
    reactive<AlbumsFilters>({
      search: "",
      sort: AlbumsSortEnum.date,
      sortDesc: true,
    });

  const needsAllLoaded = computed(() => filters.sort !== AlbumsSortEnum.date);

  const filteredAlbums = computed(() => {
    const albums = toValue(options.albums);
    let result = [...albums];

    // Фильтрация по поиску (title и description)
    const searchQuery = filters.search.toLowerCase().trim();

    if (searchQuery) {
      result = result.filter((album) => {
        const title = album.title?.toLowerCase() ?? "";
        const description = album.description?.toLowerCase() ?? "";

        return title.includes(searchQuery) || description.includes(searchQuery);
      });
    }

    // Сортировка
    result = sortAlbums(result, filters.sort, filters.sortDesc);

    return result;
  });

  const filteredIndexes = useGridIndexes(
    () => filteredAlbums.value.length,
    options.columns,
  );

  function sortAlbums(
    albums: IAlbumItem[],
    sortType: AlbumsSortEnum,
    desc: boolean,
  ): IAlbumItem[] {
    // Для date сортировки мы теперь используем параметр rev в API (см. useAlbums.ts).
    // Поэтому массив уже приходит в нужном порядке.
    if (sortType === AlbumsSortEnum.date) {
      return albums;
    }

    // Если данные не загружены полностью, не применяем сложную сортировку
    if (!toValue(options.isAllLoaded)) {
      return albums;
    }

    const sorted = [...albums].sort((a, b) => {
      let comparison = 0;

      switch (sortType) {
        case AlbumsSortEnum.size:
          comparison = toNumber(a.size) - toNumber(b.size);
          break;
        case AlbumsSortEnum.created:
          comparison = (a.created ?? 0) - (b.created ?? 0);
          break;
        case AlbumsSortEnum.updated:
          comparison = (a.updated ?? 0) - (b.updated ?? 0);
          break;
      }

      return desc ? -comparison : comparison;
    });

    return sorted;
  }

  return {
    filters,
    showFilters,
    filteredAlbums,
    filteredIndexes,
    needsAllLoaded,
  };
}
