import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import { computed } from "vue";
import AAbout from "../pages/AAbout/AAbout.vue";
import ABackup from "../pages/ABackup/ABackup.vue";
import AGroups from "../pages/AGroups/AGroups.vue";
import AAdd from "../pages/AAdd/AAdd.vue";

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

export const routerBackExist = computed(() => true);

export const routerBack = () => {
  if (routerBackExist.value) {
    router.back();
    return true;
  }

  return false;
};
