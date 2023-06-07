import { isNullOrUndefined } from "../../helpers/isNullOrUndefined";
import { IGroup } from "../../store/groups/types";
import { useGroups } from "../../store/groups/groups";

export function getGroupState(group: IGroup) {
  const groupsService = useGroups();
  const localGroup = groupsService.getLocalGroupById(group.id);
  const isVisibleJoin = group.name != "Частная группа" && !group?.is_request;
  const isBanned =
    group.photo_200 === "https://vk.com/images/deactivated_kis_200.png" ||
    group.deactivated;
  const text = [];
  if (isNullOrUndefined(groupsService.filters.folder) && localGroup) {
    text.push(localGroup.folder);
  }

  if (isBanned) {
    text.push("Забанено");
  }
  if (group?.is_member) {
    text.push("Вы состоите");
  }
  if (group?.is_request) {
    text.push("Вы подали заявку на вступление");
  }
  if (group?.is_admin) {
    text.push("Вы администратор");
  }
  if (group?.is_advertiser) {
    text.push("Вы рекламодатель");
  }
  if (group?.is_closed) {
    text.push("Закрытая");
  }

  return { text, isBanned, isVisibleJoin };
}
