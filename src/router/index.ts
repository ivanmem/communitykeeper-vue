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
import { useDialog } from "@/store/dialog/dialog";
import GroupsPageWrapper from "@/pages/Groups/GroupsPageWrapper.vue";
import SettingsPage from "@/pages/Settings/SettingsPage.vue";
import AboutPage from "@/pages/About/AboutPage.vue";
import AddPageWrapper from "@/pages/Add/AddPageWrapper.vue";
import HistoryPageWrapper from "@/pages/History/HistoryPageWrapper.vue";
import AlbumPageWrapper from "@/pages/Album/AlbumPageWrapper.vue";
import AlbumsWrapper from "@/pages/Albums/AlbumsWrapper.vue";
import PageNotFound from "@/shared/widgets/PageNotFound.vue";

const routes: RouteRecordRaw[] = [
  {
    path: "/",
    component: GroupsPageWrapper,
  },
  {
    path: "/settings/",
    component: SettingsPage,
  },
  {
    path: "/about/",
    component: AboutPage,
  },
  {
    name: "add",
    path: "/add/",
    component: AddPageWrapper,
  },
  {
    path: "/history/",
    component: HistoryPageWrapper,
  },
  {
    name: "album",
    path: "/albums/:ownerId/:albumId/:photoId?",
    component: AlbumPageWrapper,
    strict: true,
  },
  {
    name: "albums",
    path: "/albums/:ownerId",
    component: AlbumsWrapper,
    strict: true,
  },
  {
    path: "/:catchAll(.*)",
    component: PageNotFound,
    strict: false,
  },
];

export const router = createRouter({
  history: createWebHashHistory("https://vk.com/app51658481"),
  routes,
});

router.beforeResolve((to, from, next) => {
  const dialogStore = useDialog();
  if (dialogStore.windows.size > 0) {
    return false;
  }

  next();
});

router.beforeEach(async (to, from) => {
  if (to.path.startsWith("/album")) {
    let [ownerIdStr, albumIdStr] = to.path
      .substring("/album".length)
      .split("_");
    const ownerId = parseFloat(ownerIdStr);
    let albumId = albumIdStr == "wall" ? -7 : parseFloat(albumIdStr);
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
      const apiService = await useVk().getApiService();
      const albumId = await apiService.getAlbumIdFromPhotoIdAndOwnerId(
        ownerId,
        photoId,
      );
      return { path: `/albums/${ownerId}/${albumId}/${photoId}` };
    } catch {}
  }

  if (to.query?.vk_app_id && from.fullPath === "/") {
    return { path: to.hash.replace("#", "") || "/", replace: true };
  }
});
router.afterEach((to) => {
  bridge
    .send("VKWebAppSetLocation", {
      location: to.fullPath,
      replace_state: true,
    })
    .then();
  const historyStore = useHistory();
  historyStore.afterEach(to as NavigationHookAfter & RouteLocationNormalized);
});
bridge.subscribe((event) => {
  if (event.detail.type === "VKWebAppChangeFragment") {
    router.replace(event.detail.data.location).then();
  }
});
