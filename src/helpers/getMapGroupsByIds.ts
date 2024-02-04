import { useVk } from "@/store/vk/vk";
import { IGroup } from "@/store/groups/types";
import { from } from "linq-to-typescript";
import { getGroupsByIdsRaw } from "@/helpers/getGroupsByIdsRaw";

export async function getMapGroupsByIds(
  ids: number[],
): Promise<Map<number, IGroup | undefined>> {
  try {
    const vkStore = useVk();
    const array = await from(ids)
      .chunk(500)
      .selectManyAsync(getGroupsByIdsRaw)
      .toMap((x) => x.id);
    return ids.reduce((previousValue, currentValue) => {
      previousValue.set(
        currentValue,
        array.get(currentValue)?.[0] ?? undefined,
      );
      return previousValue;
    }, new Map<number, IGroup | undefined>());
  } catch (ex: any) {
    console.warn(ex);
    return new Map();
  }
}
