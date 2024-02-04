import { useVk } from "@/store/vk/vk";
import { IGroup } from "@/store/groups/types";

export function getGroupsByIdsRaw(ids: (number | string)[]): Promise<IGroup[]> {
  return useVk().addRequestToQueue({
    method: "groups.getById",
    params: {
      group_ids: ids.join(),
      fields: "counters,member_status",
    },
  });
}
