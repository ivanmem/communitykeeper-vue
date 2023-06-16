import { defineStore } from "pinia";
import { random } from "lodash";

interface AppState {
  caption: string;
  loadingSet: Set<any>;
}

export const useApp = defineStore("app", {
  state(): AppState {
    return {
      caption: "",
      loadingSet: new Set(),
    };
  },
  getters: {
    isLoading(): boolean {
      return this.loadingSet.size !== 0;
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
