import { IGroupCounters } from "@/store/groups/types";

export type HistoryKeyViewOwner = `view_owner_${number | string}`;
export type HistoryKeyViewAlbum = `view_album_${number | string}_${
  | number
  | string}`;
export type HistoryKeyCounter = `view_counter_${number | string}_${string}`;

export type HistoryKey =
  | HistoryKeyViewOwner
  | HistoryKeyViewAlbum
  | HistoryKeyCounter;

export type HistoryTypeViewOwner = "view_owner";
export type HistoryTypeViewAlbum = "view_album";
export type HistoryTypeViewCounter = "view_counter";

export type HistoryType =
  | HistoryTypeViewOwner
  | HistoryTypeViewAlbum
  | HistoryTypeViewCounter;

export interface HistoryItemViewOwner {
  type: HistoryTypeViewOwner;
  ownerId: string | number;
}

export interface HistoryItemViewAlbum {
  type: HistoryTypeViewAlbum;
  ownerId: string | number;
  albumId: string | number;
  photoId: string | number;
  subtitle?: string;
}

export interface HistoryItemViewOwnerCounter {
  type: HistoryTypeViewCounter;
  url: string;
  ownerId: string | number;
  counter: keyof IGroupCounters;
}

export type HistoryItem =
  | HistoryItemViewOwner
  | HistoryItemViewOwnerCounter
  | HistoryItemViewAlbum;

export interface HistoryState {
  history: Record<HistoryKey, HistoryItem>;
}
