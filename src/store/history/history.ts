import { defineStore } from "pinia";
import type { NavigationHookAfter, RouteLocationNormalized } from "vue-router";
import { MAX_SIZE_ONE_VK_VALUE } from "@/common/consts";

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
    historyArray(): HistoryItem[] {
      return Object.values(this.history).reverse();
    },
    oldestKey(): HistoryKey | undefined {
      return this.historyArray.at(-1) as any;
    },
    length(): number {
      return Object.keys(this.history).length;
    },
  },
  persist: {
    storage: localStorage,
    paths: ["history"],
  },
});
