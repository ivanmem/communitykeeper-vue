import { defineStore } from "pinia";

interface AppState {
  caption: string;
}

export const useApp = defineStore("app", {
  state(): AppState {
    return {
      caption: "",
    };
  },
});
