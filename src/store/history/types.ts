import { IGroupCounters } from "@/store/groups/types";

export type HistoryKeyViewOwner = `vo_${number | string}`;
export type HistoryKeyViewAlbum = `va_${number | string}_${
  | number
  | string}`;
export type HistoryKeyCounter = `vc_${number | string}_${string}`;

export type HistoryKey =
  | HistoryKeyViewOwner
  | HistoryKeyViewAlbum
  | HistoryKeyCounter;

export type HistoryTypeViewOwner = "vo";
export type HistoryTypeViewAlbum = "va";
export type HistoryTypeViewCounter = "vc";

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
  maxSize: number;
}
