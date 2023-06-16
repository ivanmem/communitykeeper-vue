import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import AAbout from "/src/pages/AAbout/AAbout.vue";
import ASettings from "/src/pages/ASettings/ASettings.vue";
import AGroups from "/src/pages/AGroups/AGroups.vue";
import AAdd from "/src/pages/AAdd/AAdd.vue";
import bridge from "@vkontakte/vk-bridge";

const routes: RouteRecordRaw[] = [
  { path: "/", component: AGroups },
  { path: "/settings", component: ASettings },
  { path: "/about", component: AAbout },
  { path: "/add", component: AAdd },
];

export const router = createRouter({
  history: createWebHashHistory("https://vk.com/app51658481"),
  routes,
});

router.beforeEach(async (to, from) => {
  if (to.query?.vk_app_id && from.fullPath === "/") {
    return { path: to.hash.replace("#", "") || "/", replace: true };
  }
});
router.afterEach((to) => {
  bridge.send("VKWebAppSetLocation", {
    location: to.fullPath,
    replace_state: true,
  });
});
bridge.subscribe((event) => {
  if (event.detail.type === "VKWebAppChangeFragment") {
    router.replace(event.detail.data.location);
  }
});
