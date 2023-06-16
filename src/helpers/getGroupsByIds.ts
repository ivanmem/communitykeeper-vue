import { isNumber } from "lodash";
import { useVk } from "@/store/vk/vk";
import { IGroup } from "@/store/groups/types";

export async function getGroupsByLinksOrIds(
  linksOrIds: (string | number)[]
): Promise<IGroup[]> {
  const group_ids: string[] = [];
  linksOrIds.forEach((value) => {
    if (isNumber(value)) {
      group_ids.push(`${value}`);
      return;
    }

    if (
      value.includes(".com/public") &&
      isNumber(value.substring(value.lastIndexOf(".com/public") + 11))
    ) {
      group_ids.push(value.substring(value.lastIndexOf(".com/public") + 11));
      return;
    }

    group_ids.push(value.substring(value.lastIndexOf("/") + 1));
  });

  if (group_ids.length === 0) {
    return [];
  }

  try {
    return await useVk().addRequestToQueue({
      method: "groups.getById",
      params: {
        group_ids: group_ids.join(),
      },
    });
  } catch (ex: any) {
    console.warn(ex);
    return [];
  }
}
