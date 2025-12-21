import { computed, unref } from "vue";
import { MaybeRef } from "@vueuse/core";
import { IGroup, IGroupCounters } from "@/store/groups/types";
import { useGroups } from "@/store/groups/groups";
import {
  Icon28ArticleOutline,
  Icon28Attachments,
  Icon28PictureOutline,
  Icon28Video,
} from "vue-vkontakte-icons";
import { t } from "@/i18n";

export interface IGroupCounter {
  icon: any;
  url: string;
  name: string;
  label: string;
  key: keyof IGroupCounters;
}

export function useGroupCounters(groupRef: MaybeRef<IGroup>) {
  const groupsStore = useGroups();
  return computed((): IGroupCounter[] => {
    const group = unref(groupRef);
    const result: IGroupCounter[] = [];

    const add = (
      key: keyof IGroupCounters,
      icon: any,
      nameKey: "photos" | "albums" | "videos" | "articles",
      link: string,
      galleryLink?: string,
    ) => {
      let label: string = (() => {
        switch (key) {
          // group.counters.photos не совпадает с количеством фото на стене
          case "photos":
            return "";
          case "albums":
            if (!group.counters?.albums) return "0";
            return `${group.counters.albums}  ~${group.counters.photos ?? 0}`;
          default:
            return `${group.counters?.[key] ?? "0"}`;
        }
      })();
      if (label != "0") {
        result.push({
          key,
          icon,
          name: t(`counters.${nameKey}`),
          url: groupsStore.config.gallery && galleryLink ? galleryLink : link,
          label: label,
        });
      }
    };

    add(
      "photos",
      Icon28PictureOutline,
      "photos",
      `//vk.com/album-${group.id}_00`,
      `/albums/-${group.id}/-7`,
    );
    add(
      "albums",
      Icon28Attachments,
      "albums",
      `//vk.com/albums-${group.id}`,
      `/albums/-${group.id}`,
    );
    add("videos", Icon28Video, "videos", `//vk.com/videos-${group.id}`);
    add(
      "articles",
      Icon28ArticleOutline,
      "articles",
      `//vk.com/@public${group.id}`,
    );

    return result;
  });
}
