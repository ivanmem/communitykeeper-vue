import isNumber from "lodash/isNumber";
import { useVk } from "@/store/vk/vk";
import { IGroup } from "@/store/groups/types";
import { from } from "linq-to-typescript";

export async function getGroupsByLinksOrIds(
  linksOrIds: (string | number)[],
): Promise<IGroup[]> {
  try {
    return await from(linksOrIds)
      .select((value) => {
        if (isNumber(value)) {
          return `${value}`;
        }

        if (
          value.includes(".com/public") &&
          isNumber(value.substring(value.lastIndexOf(".com/public") + 11))
        ) {
          return value.substring(value.lastIndexOf(".com/public") + 11);
        }

        return value.substring(value.lastIndexOf("/") + 1);
      })
      .chunk(500)
      .selectManyAsync(
        (groupIdsChunk): Promise<IGroup[]> =>
          useVk().addRequestToQueue({
            method: "groups.getById",
            params: {
              group_ids: groupIdsChunk.join(),
              fields: "counters",
            },
          }),
      )
      .toArray();
  } catch (ex: any) {
    console.warn(ex);
    return [];
  }
}
