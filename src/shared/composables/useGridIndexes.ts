import { computed, MaybeRefOrGetter, Ref, toValue } from "vue";

export function useGridIndexes(
  itemsLength: MaybeRefOrGetter<number>,
  columns: Ref<number>,
) {
  const indexes = computed(() => {
    const result: number[][] = [];
    const cols = columns.value;
    const length = toValue(itemsLength);

    if (cols === 0) {
      return result;
    }

    for (let i = 0; i < length; i += cols) {
      const row: number[] = [];
      for (let j = 0; j < cols && i + j < length; j++) {
        row.push(i + j);
      }

      if (row.length > 0) {
        result.push(row);
      }
    }

    return result;
  });

  return indexes;
}
