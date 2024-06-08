import { computed, unref } from "vue";
import { MaybeRef } from "@vueuse/core";
import { IGroup, IGroupCounters } from "@/store/groups/types";
import { icons } from "@/common/consts";
import { useGroups } from "@/store/groups/groups";

export interface IGroupCounter {
  icon: any;
  url: string;
  name: string;
  label: string;
  key: keyof IGroupCounters;
}

const {
  Icon28PictureOutline,
  Icon28Attachments,
  Icon28Video,
  Icon28ArticleOutline,
} = icons;

export function useGroupCounters(groupRef: MaybeRef<IGroup>) {
  const groupsStore = useGroups();
  return computed((): IGroupCounter[] => {
    const group = unref(groupRef);
    const result: IGroupCounter[] = [];

    const add = (
      key: keyof IGroupCounters,
      icon: any,
      name: string,
      link: string,
      galleryLink?: string,
      addAlways = false,
    ) => {
      let label: string = (() => {
        switch (key) {
            // group.counters.photos не совпадает с количеством фото на стене
          case "photos":
            return "";
          case "albums":
            if (!group.counters?.albums) return '';
            return `${group.counters.albums}  ~${group.counters.photos ?? 0}`;
          default:
            return `${group.counters?.[key] ?? ""}`;
        }
      })();
      if (label != "" || addAlways) {
        result.push({
          key,
          icon,
          name,
          url: groupsStore.config.gallery && galleryLink ? galleryLink : link,
          label: label,
        });
      }
    };

    add(
      "photos",
      Icon28PictureOutline,
      "Фотографий",
      `//vk.com/album-${group.id}_00`,
      `/albums/-${group.id}/-7`,
      true,
    );
    add(
      "albums",
      Icon28Attachments,
      "Альбомов",
      `//vk.com/albums-${group.id}`,
      `/albums/-${group.id}`,
    );
    add("videos", Icon28Video, "Видеозаписей", `//vk.com/videos-${group.id}`);
    add(
      "articles",
      Icon28ArticleOutline,
      "Статей",
      `//vk.com/@public${group.id}`,
    );

    return result;
  });
}
