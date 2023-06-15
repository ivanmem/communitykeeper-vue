import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import { computed } from "vue";
import AAbout from "../pages/AAbout/AAbout.vue";
import ABackup from "../pages/ABackup/ABackup.vue";
import AGroups from "../pages/AGroups/AGroups.vue";
import AAdd from "../pages/AAdd/AAdd.vue";
import bridge from "@vkontakte/vk-bridge";

const routes: RouteRecordRaw[] = [
  { path: "/", component: AGroups },
  { path: "/backup", component: ABackup },
  { path: "/about", component: AAbout },
  { path: "/add", component: AAdd },
];

export const router = createRouter({
  history: createWebHashHistory("https://vk.com/app51658481"),
  routes,
});

router.beforeEach(async (to, from) => {
  if (to.query?.vk_app_id && from.fullPath === '/') {
    return { path: to.hash.replace('#', '') || '/', replace: true };
  }
});
router.afterEach((to) => {
  bridge.send('VKWebAppSetLocation', {
    location: to.fullPath,
    replace_state: true,
  });
});
bridge.subscribe((event) => {
  if (event.detail.type === 'VKWebAppChangeFragment') {
    router.replace(event.detail.data.location);
  }
});
