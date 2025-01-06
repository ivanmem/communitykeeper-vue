import { Ref, ShallowReactive, shallowReactive, watch } from "vue";

export interface GridArray<T> {
  items: Readonly<ShallowReactive<T[]>>;
  indexes: Readonly<ShallowReactive<Array<Array<number>>>>;
  push: (...items: T[]) => void;
  clear: () => void;
}

export function useGridArray<T>(columns: Ref<number>): GridArray<T> {
  const items = shallowReactive<T[]>([]);
  const indexes = shallowReactive<Array<Array<number>>>([]);

  watch(columns, () => {
    indexes.length = 0;
    pushIndexes(items);
  });

  const push = (...newItems: T[]) => {
    items.push(...newItems);
    pushIndexes(newItems);
  };

  const pushIndexes = (newItems: T[]) => {
    if (columns.value === 0) {
      return;
    }

    if (indexes.length === 0) {
      indexes.push([]);
    }

    for (let index = 0; index < newItems.length; index++) {
      const itemsIndex = index + items.length - newItems.length;
      const lastIndexedRow = indexes[indexes.length - 1];
      if (lastIndexedRow.length < columns.value) {
        lastIndexedRow.push(itemsIndex);
      } else {
        indexes.push([itemsIndex]);
      }
    }
  };

  const clear = () => {
    items.length = 0;
    indexes.length = 0;
  };

  return {
    items,
    indexes,
    push,
    clear,
  };
}
