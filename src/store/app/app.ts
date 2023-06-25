import { defineStore } from "pinia";
import { random } from "lodash";
import { platform } from "@vkontakte/vkui";

interface AppState {
  caption: string;
  loadingSet: Set<any>;
  platform: "android" | "ios" | "vkcom";
  isFullScreen: boolean;
}

export const useApp = defineStore("app", {
  state(): AppState {
    return {
      caption: "",
      loadingSet: new Set(),
      platform: platform() as any,
      isFullScreen: false,
    };
  },
  getters: {
    isLoading(): boolean {
      return this.loadingSet.size !== 0;
    },
    isVkCom(): boolean {
      return this.platform === "vkcom";
    },
  },
  actions: {
    getLoadingFinisher(): () => void {
      const id = random(true);
      this.loadingSet.add(id);
      return () => this.loadingSet.delete(id);
    },
    wrapLoading<T = any>(action: (...args: any) => T) {
      return async (...args: any) => {
        const loadingFinisher = useApp().getLoadingFinisher();
        try {
          return await action(...args);
        } finally {
          loadingFinisher();
        }
      };
    },
  },
});
