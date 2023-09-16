import { defineStore } from "pinia";
import type { NavigationHookAfter, RouteLocationNormalized } from "vue-router";
import { MAX_SIZE_ONE_VK_VALUE } from "@/common/consts";
import { from } from "linq-to-typescript";

type HistoryKey =
  | `view_owner_${number | string}`
  | `view_album_${number | string}_${number | string}`;

interface HistoryState {
  history: Record<HistoryKey, HistoryItem>;
}

export type HistoryItem = HistoryItemViewOwner | HistoryItemViewAlbum;

export interface HistoryItemViewOwner {
  type: "view_owner";
  ownerId: string | number;
}

export interface HistoryItemViewAlbum {
  type: "view_album";
  ownerId: string | number;
  albumId: string | number;
  photoId: string | number;
  subtitle?: string;
}

export const useHistory = defineStore("history", {
  state: (): HistoryState => {
    return { history: {} };
  },
  actions: {
    getViewOwnerKey(ownerId: string | number): `view_owner_${number | string}` {
      return `view_owner_${ownerId}`;
    },
    getViewAlbumKey(
      ownerId: string | number,
      albumId: string | number,
    ): `view_album_${number | string}_${string | number}` {
      return `view_album_${ownerId}_${albumId}}`;
    },
    getViewAlbum(ownerId: string | number, albumId: string | number) {
      const key = this.getViewAlbumKey(ownerId, albumId);
      return this.history[key] as HistoryItemViewAlbum | undefined;
    },
    afterEach(to: NavigationHookAfter & RouteLocationNormalized) {
      const { ownerId, albumId, photoId } = to.params as Record<string, string>;
      if (to.name === "albums" && `${ownerId ?? ""}`) {
        const ownerId = to.params.ownerId as string;
        this.add({
          type: `view_owner`,
          ownerId,
        });
      }

      if (
        to.name === "album" &&
        `${ownerId ?? ""}` &&
        `${albumId ?? ""}` &&
        `${photoId ?? ""}`
      ) {
        this.add({
          type: `view_album`,
          ownerId,
          albumId,
          photoId,
        });
      }
    },
    add(historyItem: HistoryItem) {
      const key: HistoryKey = (() => {
        if (historyItem.type === "view_owner") {
          return this.getViewOwnerKey(historyItem.ownerId);
        }

        if (historyItem.type === "view_album") {
          return this.getViewAlbumKey(historyItem.ownerId, historyItem.albumId);
        }

        throw new Error("not implemented: " + (historyItem as any).type);
      })();
      delete this.history[key];
      this.history[key] = historyItem;
      if (JSON.stringify(this.history).length >= MAX_SIZE_ONE_VK_VALUE) {
        delete this.history[this.oldestKey!];
      }
    },
    clear() {
      this.history = {};
    },
  },
  getters: {
    historyKeys(): HistoryKey[] {
      return Object.keys(this.history) as HistoryKey[];
    },
    length(): number {
      return this.historyKeys.length;
    },
    historyArray(): HistoryItem[] {
      return from(this.historyKeys)
        .reverse()
        .select((key) => this.history[key])
        .toArray();
    },
    historyGroupByType(): Map<"view_owner" | "view_album", HistoryItem[]> {
      return from(this.historyArray).toMap((x) => x.type);
    },
    historyArrayViewAlbum(): HistoryItemViewAlbum[] {
      return this.historyGroupByType.get(
        "view_album",
      ) as HistoryItemViewAlbum[];
    },
    historyArrayViewOwner(): HistoryItemViewOwner[] {
      return this.historyGroupByType.get(
        "view_owner",
      ) as HistoryItemViewOwner[];
    },
    oldestKey(): HistoryKey | undefined {
      return this.historyArray.at(-1) as any;
    },
  },
  persist: {
    storage: localStorage,
    paths: ["history"],
  },
});
