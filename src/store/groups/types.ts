import { GroupState } from "@/pages/AGroups/getGroupState";

export interface ILocalGroup {
  id: number;
  folder: string;
}

export interface IGroup {
  id: number;
  is_admin: boolean;
  is_advertiser: boolean;
  deactivated?: "banned";
  is_closed: boolean;
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
  __state?: GroupState;
}

export interface IGroupCounters {
  photos: number;
  albums: number;
  topics: number;
  videos: number;
  market: number;
  articles: number;
  narratives: number;
  addresses: number;
  clips?: number;
  clips_followers?: number;
}

export interface IGroupsExport {
  /** @description ключ - название папки; значение - список ID групп. */
  groupIdsDictByFolderName: Record<string, number[]>;
}
