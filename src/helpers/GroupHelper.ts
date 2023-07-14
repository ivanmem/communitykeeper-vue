import { IGroup } from "@/store/groups/types";
import {
  FiltersType,
  GroupsSortEnum,
  OnlyAccessEnum,
  useGroups,
} from "@/store/groups/groups";
import { getGroupState, GroupState } from "@/pages/AGroups/getGroupState";
import bridge from "@vkontakte/vk-bridge";
import shuffle from "lodash/shuffle";

class GroupHelper {
  static getGroupAccess(g?: IGroup) {
    return (g?.is_closed && g.is_member) || !g?.is_closed;
  }

  static getFiltered(groups: IGroup[], filters?: FiltersType) {
    if (!filters) {
      return groups;
    }

    const groupsService = useGroups();
    const search = filters?.search.trim().toLowerCase();
    let result = groups.filter((group) => {
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
          result = result.reverse();
          break;
        case GroupsSortEnum.random:
          result = shuffle(result);
          break;
      }
    }

    return result;
  }

  static getState(group: IGroup): GroupState {
    group.counters ??= useGroups().getCachedGroup(group)?.counters;
    group.__state ??= getGroupState(group);
    return group.__state;
  }

  static async setIsMember(group: IGroup, isMember: boolean) {
    const result = await bridge.send(
      isMember ? "VKWebAppJoinGroup" : "VKWebAppLeaveGroup",
      { group_id: group.id }
    );
    if (result.result) {
      group.is_member = isMember;
      group.__state = undefined;
    }

    return result.result;
  }
}

export default GroupHelper;
