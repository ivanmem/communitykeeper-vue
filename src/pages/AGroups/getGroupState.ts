import { isNullOrUndefined } from "@/helpers/isNullOrUndefined";
import { GroupState, IGroup } from "@/store/groups/types";
import { useGroups } from "@/store/groups/groups";
import { isGroupBanned } from "@/helpers/isGroupBanned";

export function getGroupState(group: IGroup): GroupState {
  const groupsService = useGroups();
  const localGroup = groupsService.getLocalGroupById(group.id);
  const isVisibleJoin = group.name != "Частная группа" && !group.is_request;
  const isBanned = isGroupBanned(group);
  const text = [];
  if (isNullOrUndefined(groupsService.filters.folder) && localGroup) {
    text.push(localGroup.folder);
  }

  const isPartialBan =
    isBanned && group.photo_200.endsWith("deactivated_kis_200.png");
  if (isBanned) {
    text.push(isPartialBan ? "Частично забанено" : "Забанено");
  }

  if (!isPartialBan) {
    if (group.is_member) {
      text.push("Вы участник");
    } else {
      text.push("Вы не участник");
    }
  }

  if (group.is_request) {
    text.push("Вы подали заявку на участие");
  }

  if (group.is_admin) {
    text.push("Вы администратор");
  }
  if (group.is_advertiser) {
    text.push("Вы рекламодатель");
  }
  if (group.is_closed) {
    text.push("Закрытая");
  }

  return { text: text.join("; "), isBanned, isVisibleJoin };
}
