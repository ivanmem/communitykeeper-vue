import { IGroup } from "@/store/groups/types";
import {
  FiltersType,
  GroupsSortEnum,
  OnlyAccessEnum,
  useGroups,
} from "@/store/groups/groups";
import { getGroupState, GroupState } from "@/pages/AGroups/getGroupState";
import bridge from "@vkontakte/vk-bridge";
import { from, IEnumerable, NumberComparer } from "linq-to-typescript";

class GroupHelper {
  static getGroupAccess(g?: IGroup) {
    if (!g || GroupHelper.getState(g).isBanned !== undefined) {
      return false;
    }

    if (!g.is_closed) {
      return true;
    }

    return g.is_closed && g.is_member;
  }

  static getFiltered(groupsIds: number[], filters?: FiltersType): IGroup[] {
    const groupsService = useGroups();
    let groupsIter: IEnumerable<IGroup> = from(groupsIds).select(
      (id) => groupsService.groupsMap.get(id)!,
    );
    if (!filters) {
      return groupsIter.toArray();
    }

    const search = filters?.search.trim().toLowerCase();
    groupsIter = groupsIter.where((group) => {
      const localGroup = groupsService.getLocalGroupById(group.id);
      if (!localGroup) {
        return false;
      }

      const isAccessGroup = GroupHelper.getGroupAccess(group);
      if (
        (filters.access === OnlyAccessEnum.access && !isAccessGroup) ||
        (filters.access === OnlyAccessEnum.noAccess && isAccessGroup) ||
        (filters.access === OnlyAccessEnum.open && group.is_closed) ||
        (filters.access === OnlyAccessEnum.close && !group.is_closed)
      ) {
        return false;
      }

      if (
        filters.folder.length > 0 &&
        filters.folder.trim().toLowerCase() !=
          localGroup.folder.trim().toLowerCase()
      ) {
        return false;
      }

      if (
        search?.length > 0 &&
        !group.name.toLowerCase().includes(search) &&
        !GroupHelper.getState(group).text.toLowerCase().includes(search)
      ) {
        return false;
      }

      return true;
    });

    if (filters.sort !== undefined && filters.sort !== GroupsSortEnum.newest) {
      switch (filters.sort) {
        case GroupsSortEnum.oldest:
          groupsIter = groupsIter.reverse();
          break;
        case GroupsSortEnum.random:
          // Аналогично snuffle
          groupsIter = groupsIter.orderBy(() => Math.random(), NumberComparer);
          break;
      }
    }

    return groupsIter.toArray();
  }

  static getState(group: IGroup): GroupState {
    group.counters ??= useGroups().getCachedGroup(group)?.counters;
    group.__state ??= getGroupState(group);
    return group.__state;
  }

  static async setIsMember(group: IGroup, isMember: boolean) {
    const result = await bridge.send(
      isMember ? "VKWebAppJoinGroup" : "VKWebAppLeaveGroup",
      { group_id: group.id },
    );
    if (result.result) {
      group.is_member = isMember;
      group.__state = undefined;
    }

    return result.result;
  }
}

export default GroupHelper;
