import { defineStore } from "pinia";
import { DialogOpenOptions, DialogState } from "@/store/dialog/types";
import uniqueId from "lodash-es/uniqueId";
import { markRaw } from "vue";
import AlertDialog, { AlertDialogProps } from "@/components/AlertDialog";

export const useDialog = defineStore("dialog", {
  state: (): DialogState => {
    return { windows: new Map() };
  },
  actions: {
    open<T>(options: DialogOpenOptions<T & Record<any, any>>) {
      options.component = markRaw(options.component);
      const key = uniqueId("a-dynamic-dialog__");
      const extendedProps: Record<any, any> = {};
      const onClose = options.props?.onClose;
      extendedProps.onClose = () => {
        this.windows.delete(key);
        if (onClose) {
          onClose();
        }
      };

      options.props ??= {} as any;
      Object.assign(options.props as any, extendedProps);
      this.windows.set(key, { key, options });
    },
    alert(props: Exclude<AlertDialogProps, "mode"> | string) {
      if (typeof props === "string") {
        props = {
          subtitle: props,
        };
      }

      (props as AlertDialogProps).mode = "alert";
      this.open({ component: AlertDialog, props });
    },
    confirm(props: Exclude<AlertDialogProps, "mode"> | string) {
      if (typeof props === "string") {
        props = {
          subtitle: props,
        };
      }

      return new Promise<boolean>((resolve) => {
        if (typeof props === "string") {
          throw new Error();
        }

        const extendedProps: AlertDialogProps & Record<any, any> = {
          ...props,
          mode: "confirm",
          onConfirm: () => {
            resolve(true);
          },
          onClose: () => {
            resolve(false);
          },
        };
        this.open({ component: AlertDialog, props: extendedProps });
      });
    },
  },
  getters: {},
});
