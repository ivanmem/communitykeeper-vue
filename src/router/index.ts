import { createRouter, createWebHashHistory, RouteRecordRaw } from "vue-router";
import bridge from "@vkontakte/vk-bridge";
import { useVk } from "@/store/vk/vk";

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
    path: "/albums/:ownerId",
    component: () => import("@/pages/AAlbums/AAlbums.vue"),
    props: true,
  },
  {
    path: "/albums/:ownerId/:albumId/:photoId?",
    component: () => import("@/pages/AAlbum/AAlbum.vue"),
    props: true,
  },
];

export const router = createRouter({
  history: createWebHashHistory("https://vk.com/app51658481"),
  routes,
});

router.beforeEach(async (to, from) => {
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
    if (ownerId > 0) {
      // для пользовательских фото метод недоступен
      return;
    }

    try {
      const albumId = (
        await useVk().addRequestToQueue({
          method: "photos.getById",
          params: {
            photos: `${ownerId}_${photoId}`,
            access_token: useVk().token?.access_token,
          },
        })
      )[0].album_id;
      if (!Number.isNaN(ownerId) && !Number.isNaN(photoId)) {
        return { path: `/albums/${ownerId}/${albumId}/${photoId}` };
      }
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
});
bridge.subscribe((event) => {
  if (event.detail.type === "VKWebAppChangeFragment") {
    router.replace(event.detail.data.location);
  }
});
