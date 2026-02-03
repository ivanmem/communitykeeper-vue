import { GroupState, IGroup, IGroupMemberStatus } from "@/store/groups/types";
import {
  FiltersType,
  GroupsSortEnum,
  groupsSortKeys,
  OnlyAccessEnum,
  useGroups,
} from "@/store/groups/groups";
import { getGroupState } from "@/pages/Groups/getGroupState";
import bridge from "@vkontakte/vk-bridge";
import { from, IEnumerable, NumberComparer } from "linq-to-typescript";

class GroupHelper {
  static getGroupAccess(g?: IGroup) {
    if (!g || GroupHelper.getState(g).isBanned) {
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

      return (
        !search ||
        GroupHelper.getName(group).toLowerCase().includes(search) ||
        GroupHelper.getState(group).text.toLowerCase().includes(search)
      );
    });

    if (filters.sort !== undefined && filters.sort !== GroupsSortEnum.date) {
      switch (filters.sort) {
        case GroupsSortEnum.random: {
          groupsIter = groupsIter.orderBy(
            (x) => GroupHelper.getState(x).randomIndex,
          );
          break;
        }
        default: {
          if (!groupsService.isGroupCountersSort) {
            break;
          }

          if (!groupsService.isGroupCountersCurrentFolderLoaded) {
            break;
          }

          const key = groupsSortKeys.get(filters.sort)!;
          groupsIter = groupsIter.orderByDescending(
            (group) => (group.counters as any)?.[key] ?? 0,
            NumberComparer,
          );
          break;
        }
      }
    }

    if (filters.sortDesc) {
      groupsIter = groupsIter.reverse();
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
      if (isMember) {
        if (group.is_closed) {
          group.member_status = IGroupMemberStatus.JoiningRequestSent;
          group.is_member = false;
        } else {
          group.is_member = true;
          group.member_status = IGroupMemberStatus.Member;
        }
      } else {
        group.is_member = false;
        group.member_status = IGroupMemberStatus.NotMember;
      }

      group.__state = undefined;
    }

    return result.result;
  }

  static getName(group: IGroup) {
    return group.name.trim() || `vk.com/public${group.id}`;
  }
}

export default GroupHelper;
