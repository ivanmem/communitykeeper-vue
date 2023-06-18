import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import bridge from "@vkontakte/vk-bridge";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: () => import("@/pages/AGroups/AGroups.vue"),
  },
  {
    path: "/settings",
    component: () => import("@/pages/ASettings/ASettings.vue"),
  },
  {
    path: "/about",
    component: () => import("@/pages/AAbout/AAbout.vue"),
  },
  {
    path: "/add",
    component: () => import("@/pages/AAdd/AAdd.vue"),
  },
  {
    path: "/albums/:groupId",
    component: () => import("@/pages/AAlbums/AAlbums.vue"),
    props: true,
  },
  {
    path: "/albums/:groupId/:albumId",
    component: () => import("@/pages/AAlbum/AAlbum.vue"),
    props: true,
  },
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
