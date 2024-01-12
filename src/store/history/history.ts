import { defineStore } from "pinia";
import type { NavigationHookAfter, RouteLocationNormalized } from "vue-router";
import { MAX_SIZE_ONE_VK_VALUE } from "@/common/consts";
import { from } from "linq-to-typescript";
import {
  HistoryItem,
  HistoryItemViewAlbum,
  HistoryItemViewOwner,
  HistoryKey,
  HistoryKeyCounter,
  HistoryKeyViewAlbum,
  HistoryKeyViewOwner,
  HistoryState,
  HistoryType,
} from "@/store/history/types";
import { getPiniaPersist } from "@/helpers/getPiniaPersist";

function getHistoryKey(historyItem: HistoryItem): HistoryKey {
  switch (historyItem.type) {
    case "view_owner":
      return `view_owner_${historyItem.ownerId}` satisfies HistoryKeyViewOwner;
    case "view_album":
      return `view_album_${historyItem.ownerId}_${historyItem.albumId}}` satisfies HistoryKeyViewAlbum;
    case "view_counter":
      return `view_counter_${historyItem.ownerId}_${historyItem.counter}` satisfies HistoryKeyCounter;
  }
}

export const useHistory = defineStore("history", {
  state: (): HistoryState => {
    return { history: {} };
  },
  actions: {
    getViewAlbumKey(
      ownerId: string | number,
      albumId: string | number,
    ): HistoryKeyViewAlbum {
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
      const key = getHistoryKey(historyItem);
      delete this.history[key];
      this.history[key] = historyItem;
      while (JSON.stringify(this.history).length >= MAX_SIZE_ONE_VK_VALUE) {
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
    historyGroupByType(): Map<HistoryType, HistoryItem[]> {
      return from(this.historyArray).toMap((x) => x.type);
    },
    historyArrayViewAlbum(): HistoryItemViewAlbum[] {
      return (this.historyGroupByType.get("view_album") ||
        []) as HistoryItemViewAlbum[];
    },
    historyArrayViewOwner(): HistoryItemViewOwner[] {
      return (this.historyGroupByType.get("view_owner") ||
        []) as HistoryItemViewOwner[];
    },
    oldestKey(): HistoryKey | undefined {
      return this.historyArray.at(-1) as any;
    },
  },
  persist: getPiniaPersist({
    paths: ["history"],
  }),
});
