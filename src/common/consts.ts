import {
  Component,
  ComponentPublicInstance,
  defineAsyncComponent,
  ref,
  RenderFunction,
} from "vue";
import type Icons from "../../node_modules/@vkontakte/icons/dist/typings";

const importIconDict = import.meta.glob<any>(
  `../../node_modules/@vkontakte/icons/src/svg/**/*.svg`,
);
function importIcon(name: keyof typeof Icons) {
  const size = name.substring(4, 6) as "12" | "16" | "24" | "28";
  const nameSnackCase = `${name
    .substring(6)
    .split(/\.?(?=[A-Z])/)
    .join("_")
    .toLowerCase()}_${size}`;
  return importIconDict[
    `../../node_modules/@vkontakte/icons/src/svg/${size}/${nameSnackCase}.svg`
  ]();
}

export const icons: Record<keyof typeof Icons, any> = new Proxy(
  {},
  {
    get(icons: any, name: keyof typeof Icons) {
      icons[name] ??= defineAsyncComponent(() => importIcon(name));
      return icons[name];
    },
  },
);

export const darkColorScheme = ref(false);

export const isDev = process.env.NODE_ENV === "development";

export const VK_MAX_PHOTO_SIZE = {
  width: 2560,
  height: 2160,
} as const;
