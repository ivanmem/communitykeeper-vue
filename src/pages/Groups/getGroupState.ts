import { isNullOrUndefined } from "@/shared/helpers/isNullOrUndefined";
import { GroupState, IGroup, IGroupMemberStatus } from "@/store/groups/types";
import { useGroups } from "@/store/groups/groups";
import { isGroupBanned } from "@/shared/helpers/isGroupBanned";
import { t } from "@/i18n";

export function getGroupState(group: IGroup): GroupState {
  const groupsService = useGroups();
  const localGroup = groupsService.getLocalGroupById(group.id);
  const isVisibleJoin =
    group.name != t("groups.privateGroup") && !group.is_request;
  const isBanned = isGroupBanned(group);
  const text = [];
  if (isNullOrUndefined(groupsService.filters.folder) && localGroup) {
    text.push(localGroup.folder);
  }

  const isPartialBan =
    isBanned && group.photo_200.endsWith("deactivated_kis_200.png");
  if (isBanned) {
    text.push(isPartialBan ? t("groups.partiallyBanned") : t("groups.banned"));
  }

  if (!isPartialBan) {
    if (group.member_status === IGroupMemberStatus.Member || group.is_member) {
      text.push(t("groups.youAreMember"));
    } else {
      switch (group.member_status) {
        case IGroupMemberStatus.NotMember:
        case undefined:
          text.push(t("groups.youAreNotMember"));
          break;
        case IGroupMemberStatus.NotSureWillAttendEvent:
          text.push(t("groups.notSureWillAttend"));
          break;
        case IGroupMemberStatus.DeclinedInvitation:
          text.push(t("groups.declinedInvitation"));
          break;
        case IGroupMemberStatus.JoiningRequestSent:
          text.push(t("groups.requestSent"));
          break;
        case IGroupMemberStatus.Invited:
          text.push(t("groups.youAreInvited"));
          break;
      }
    }
  }

  if (group.is_admin) {
    text.push(t("groups.youAreAdmin"));
  }
  if (group.is_advertiser) {
    text.push(t("groups.youAreAdvertiser"));
  }
  if (group.is_closed) {
    text.push(t("groups.closed"));
  }

  return {
    text: text.join("; "),
    isBanned,
    isVisibleJoin,
    randomIndex: Math.random(),
  };
}
