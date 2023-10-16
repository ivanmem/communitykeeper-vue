import { defineStore } from "pinia";
import { DialogOpenOptions, DialogState } from "@/store/dialog/types";
import uniqueId from "lodash/uniqueId";
import { markRaw } from "vue";

export const useDialog = defineStore("dialog", {
  state: (): DialogState => {
    return { windows: new Map() };
  },
  actions: {
    open<T>(options: DialogOpenOptions<T & Record<any, any>>) {
      options.component = markRaw(options.component);
      const key = uniqueId("a-dynamic-dialog__");
      const extendedProps: Record<any, any> = {};
      extendedProps.onClose = () => {
        this.windows.delete(key);
      };

      options.props ??= {} as any;
      Object.assign(options.props as any, extendedProps);
      this.windows.set(key, { key, options });
    },
  },
  getters: {},
});
