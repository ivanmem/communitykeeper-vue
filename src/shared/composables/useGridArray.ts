import { Ref, ShallowReactive, shallowReactive } from "vue";
import { useGridIndexes } from "@/shared/composables/useGridIndexes";

export interface GridArray<T> {
  items: Readonly<ShallowReactive<T[]>>;
  indexes: ReturnType<typeof useGridIndexes>;
  push: (...items: T[]) => void;
  clear: () => void;
}

export function useGridArray<T>(columns: Ref<number>): GridArray<T> {
  const items = shallowReactive<T[]>([]);
  const indexes = useGridIndexes(() => items.length, columns);

  const push = (...newItems: T[]) => {
    items.push(...newItems);
  };

  const clear = () => {
    items.length = 0;
  };

  return {
    items,
    indexes,
    push,
    clear,
  };
}
