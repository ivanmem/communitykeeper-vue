import Vue3ContextMenu, { MenuItem } from "@imengyu/vue3-context-menu";
import { darkColorScheme } from "@/common/consts";
import { nextTick } from "vue";

export function showContextMenu(
  e: MouseEvent,
  items: MenuItem[] | undefined,
  onClose = () => {}
) {
  const contextMenuInstance = Vue3ContextMenu.showContextMenu({
    x: e.x,
    y: e.y,
    theme: darkColorScheme.value ? "mac dark" : "mac",
    items,
    closeWhenScroll: true,
    clickCloseClassName: "mx-context-no-clickable",
    onClose,
  });
  nextTick(() => {
    const el = document.getElementById("mx-menu-default-container")!;
    el.style.pointerEvents = "all";
    const closeListener = () => {
      el.style.pointerEvents = "none";
      contextMenuInstance.closeMenu();
    };
    el.addEventListener("click", (e) => {
      e.preventDefault();
      e.stopPropagation();
      closeListener();
    });
    el.addEventListener("touchmove", () => {
      closeListener();
    });
    el.addEventListener("wheel", () => {
      closeListener();
    });
  });
  return contextMenuInstance;
}
