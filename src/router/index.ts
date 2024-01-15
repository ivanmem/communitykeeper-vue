import {
  createRouter,
  createWebHashHistory,
  NavigationHookAfter,
  RouteLocationNormalized,
  RouteRecordRaw,
} from "vue-router";
import bridge from "@vkontakte/vk-bridge";
import { useVk } from "@/store/vk/vk";
import { useHistory } from "@/store/history/history";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: () => import("@/pages/AGroups/AGroupsWrapper.vue"),
  },
  {
    path: "/settings/",
    component: () => import("@/pages/ASettings/ASettings.vue"),
  },
  {
    path: "/about/",
    component: () => import("@/pages/AAbout/AAbout.vue"),
  },
  {
    name: "add",
    path: "/add/",
    component: () => import("@/pages/AAdd/AAdd.vue"),
  },
  {
    path: "/history/",
    component: () => import("@/pages/AHistory/AHistoryWrapper.vue"),
  },
  {
    name: "album",
    path: "/albums/:ownerId/:albumId/:photoId?",
    component: () => import("@/pages/AAlbum/AAlbumWrapper.vue"),
    props: true,
    strict: true,
  },
  {
    name: "albums",
    path: "/albums/:ownerId",
    component: () => import("@/pages/AAlbums/AAlbumsWrapper.vue"),
    props: true,
    strict: true,
  },
  {
    path: "/:catchAll(.*)",
    component: () => import("../components/PageNotFound.vue"),
    strict: false,
  },
];

export const router = createRouter({
  history: createWebHashHistory("https://vk.com/app51658481"),
  routes,
});

router.afterEach(async (to, from) => {
  if (to.path.startsWith("/album")) {
    let [ownerId, albumId] = to.path
      .substring("/album".length)
      .split("_")
      .map(parseFloat);
    if (albumId == 0) {
      albumId = -6;
    }

    if (!Number.isNaN(ownerId) && !Number.isNaN(albumId)) {
      return { path: `/albums/${ownerId}/${albumId}` };
    }

    if (!Number.isNaN(ownerId)) {
      return { path: `/albums/${ownerId}` };
    }
  }

  if (to.path.startsWith("/albums")) {
    let ownerId = parseFloat(to.path.substring("/albums".length));
    if (!Number.isNaN(ownerId)) {
      return { path: `/albums/${ownerId}` };
    }
  }

  if (to.path.startsWith("/photo")) {
    let [ownerId, photoId] = to.path
      .substring("/photo".length)
      .split("_")
      .map(parseFloat);
    if (Number.isNaN(ownerId) || ownerId > 0 || Number.isNaN(photoId)) {
      return;
    }

    try {
      // для пользовательских фото метод недоступен
      const albumId = (
        await useVk().addRequestToQueue({
          method: "photos.getById",
          params: {
            photos: `${ownerId}_${photoId}`,
            access_token: useVk().token?.access_token,
          },
        })
      )[0].album_id;
      return { path: `/albums/${ownerId}/${albumId}/${photoId}` };
    } catch {}
  }

  if (to.query?.vk_app_id && from.fullPath === "/") {
    return { path: to.hash.replace("#", "") || "/", replace: true };
  }
});
router.afterEach((to) => {
  bridge.send("VKWebAppSetLocation", {
    location: to.fullPath,
    replace_state: true,
  });
  const historyStore = useHistory();
  historyStore.afterEach(to as NavigationHookAfter & RouteLocationNormalized);
});
bridge.subscribe((event) => {
  if (event.detail.type === "VKWebAppChangeFragment") {
    router.replace(event.detail.data.location);
  }
});
