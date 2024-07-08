import { isNullOrUndefined } from "@/shared/helpers/isNullOrUndefined";
import { GroupState, IGroup, IGroupMemberStatus } from "@/store/groups/types";
import { useGroups } from "@/store/groups/groups";
import { isGroupBanned } from "@/shared/helpers/isGroupBanned";

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
    if (group.member_status === IGroupMemberStatus.Member || group.is_member) {
      text.push("Вы участник");
    } else {
      switch (group.member_status) {
        case IGroupMemberStatus.NotMember:
        case undefined:
          text.push("Вы не участник");
          break;
        case IGroupMemberStatus.NotSureWillAttendEvent:
          text.push("Вы не уверены, что посетите мероприятие");
          break;
        case IGroupMemberStatus.DeclinedInvitation:
          text.push("Вы отклонили приглашение");
          break;
        case IGroupMemberStatus.JoiningRequestSent:
          text.push("Заявка отправлена");
          break;
        case IGroupMemberStatus.Invited:
          text.push("Вас пригласили");
          break;
      }
    }
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

  return {
    text: text.join("; "),
    isBanned,
    isVisibleJoin,
    randomIndex: Math.random(),
  };
}
