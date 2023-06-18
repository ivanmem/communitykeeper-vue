import Vue3ContextMenu, { MenuItem } from "@imengyu/vue3-context-menu";
import { darkColorScheme } from "@/common/consts";

export function showContextMenu(e: MouseEvent, items: MenuItem[] | undefined) {
  return Vue3ContextMenu.showContextMenu({
    x: e.x,
    y: e.y,
    theme: darkColorScheme.value ? "mac dark" : "mac",
    items,
    closeWhenScroll: true,
  });
}
