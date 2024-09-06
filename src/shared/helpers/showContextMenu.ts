import Vue3ContextMenu, { MenuItem } from "@imengyu/vue3-context-menu";
import { darkColorScheme } from "@/shared/constants/consts";
import { nextTick } from "vue";

export function showContextMenu(
  e: MouseEvent | TouchEvent,
  items: MenuItem[] | undefined,
  onClose = () => {
  },
) {
  const contextMenuInstance = Vue3ContextMenu.showContextMenu({
    x: e instanceof MouseEvent ? e.x : e.touches[0].clientX,
    y: e instanceof MouseEvent ? e.y : e.touches[0].clientY,
    theme: darkColorScheme.value ? "mac dark" : "mac",
    items,
    closeWhenScroll: true,
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
      if (isEventIgnore(e)) return;
      e.preventDefault();
      e.stopPropagation();
      closeListener();
    });
    el.addEventListener("touchmove", () => {
      if (isEventIgnore(e)) return;
      closeListener();
    });
    el.addEventListener("wheel", () => {
      closeListener();
    });
  }).then();

  return contextMenuInstance;
}

function isEventIgnore(e: Event) {
  const el = e.target as HTMLElement;
  return el.classList.contains('mx-right-arrow') || el.classList.contains('mx-context-no-clickable');
}