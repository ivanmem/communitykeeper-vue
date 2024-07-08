import { defineStore } from "pinia";
import type { NavigationHookAfter, RouteLocationNormalized } from "vue-router";
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
import { getPiniaPersist } from "@/shared/helpers/getPiniaPersist";
import { VK_STORAGE } from "@/shared/constants/consts";

function getHistoryKey(historyItem: HistoryItem): HistoryKey {
  switch (historyItem.type) {
    case "vo":
      return `vo_${historyItem.ownerId}` satisfies HistoryKeyViewOwner;
    case "va":
      return `va_${historyItem.ownerId}_${historyItem.albumId}}` satisfies HistoryKeyViewAlbum;
    case "vc":
      return `vc_${historyItem.ownerId}_${historyItem.counter}` satisfies HistoryKeyCounter;
    default:
      throw new Error(
        `history type "${(historyItem as HistoryItem).type}" not implemented`,
      );
  }
}

export const useHistory = defineStore("history", {
  state: (): HistoryState => {
    return {
      history: {},
      maxSize: VK_STORAGE.chunkMaxSize * 2,
    };
  },
  actions: {
    getViewAlbumKey(
      ownerId: string | number,
      albumId: string | number,
    ): HistoryKeyViewAlbum {
      return `va_${ownerId}_${albumId}}`;
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
          type: `vo`,
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
          type: `va`,
          ownerId,
          albumId,
          photoId,
        });
      }
    },
    add(historyItem: HistoryItem) {
      const key = getHistoryKey(historyItem);
      this.history[key] = historyItem;
      while (JSON.stringify(this.history).length >= this.maxSize) {
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
      return (this.historyGroupByType.get("va") ||
        []) as HistoryItemViewAlbum[];
    },
    historyArrayViewOwner(): HistoryItemViewOwner[] {
      return (this.historyGroupByType.get("vo") ||
        []) as HistoryItemViewOwner[];
    },
    oldest(): HistoryItem | undefined {
      return this.historyArray.at(-1);
    },
    oldestKey(): HistoryKey | undefined {
      return this.historyKeys.at(0);
    },
  },
  persist: getPiniaPersist({
    paths: ["history"],
  }),
});
