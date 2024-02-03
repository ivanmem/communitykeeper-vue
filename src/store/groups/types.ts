import {
  IObjectSharedProps,
  IPhotoSize,
} from "vkontakte-api/dist/types/objects/shared";

export interface ILocalGroup {
  id: number;
  folder: string;
}

export interface GroupState {
  /** @description Отображаемый текст под названием группы */
  text: string;
  /** @description Группа забанена в ВК */
  isBanned?: boolean;
  /** @description Требуется отображать кнопку вступления */
  isVisibleJoin: boolean;
  /** @description Требуется скрыть счётчики */
  hideCounters?: boolean;
  /** @description Требуется загрузить счётчики */
  needLoadingCounters?: boolean;
  /** @description Случайный индекс для рандомной сортировки. Он генерируется один раз, чтобы сортировка была стабильной и не прыгала при фильтрации и других случаях. */
  randomIndex: number;
}

/** @link https://dev.vk.com/ru/reference/objects/group */
export interface IGroup {
  id: number;
  is_admin: boolean;
  is_advertiser: boolean;
  deactivated?: "banned" | "deleted";
  /** @description 0 - открытое, 1 - закрытое, 2 - частное */
  is_closed: 0 | 1 | 2;
  is_member: boolean;
  is_request?: boolean;
  name: string;
  photo_50: string;
  photo_100: string;
  photo_200: string;
  screen_name: string;
  type: string;
  counters?: IGroupCounters;
  countersSum?: number;
  member_status?: IGroupMemberStatus;
  __state?: GroupState;
}

/** @link https://dev.vk.com/ru/reference/objects/group#member_status */
export enum IGroupMemberStatus {
  /** @description Не является участником */
  NotMember,
  /** @description Является участником */
  Member,
  /** @description Не уверен, что посетит мероприятие */
  NotSureWillAttendEvent,
  /** @description Отклонил приглашение */
  DeclinedInvitation,
  /** @description Запрос на вступление отправлен */
  JoiningRequestSent,
  /** @description Приглашён */
  Invited,
}

/** @link https://dev.vk.com/ru/reference/objects/group#counters */
export interface IGroupCounters {
  photos?: number;
  albums?: number;
  topics?: number;
  videos?: number;
  market?: number;
  articles?: number;
  narratives?: number;
  addresses?: number;
  clips?: number;
  clips_followers?: number;
}

export interface IGroupsExport {
  /** @description ключ - название папки; значение - список ID групп. */
  groupIdsDictByFolderName: Record<string, number[]>;
}

export interface PhotoState {
  index: number;
}

/** @link https://dev.vk.com/ru/reference/objects/photo */
export interface IPhoto extends IObjectSharedProps {
  album_id: number;
  user_id: number;
  text: string;
  date: number;
  sizes: IPhotoSize[];
  post_id?: number;
  width: number;
  height: number;
  likes?: {
    count: number;
    user_likes: number;
  };
  comments?: {
    count: number;
  };
  reposts?: {
    count: number;
  };
  tags?: {
    count: number;
  };
  __state: PhotoState;
}

type OwnerId = number | string;
type PhotoId = number | string;
export type IPhotoKey = `photo${OwnerId}_${PhotoId}`;
