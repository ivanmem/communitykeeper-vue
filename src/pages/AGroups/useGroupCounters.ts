import { computed, unref } from "vue";
import { MaybeRef } from "@vueuse/core";
import { IGroup, IGroupCounters } from "@/store/groups/types";
import { icons } from "@/common/consts";

export interface IGroupCounter {
  icon: any;
  url: string;
  name: string;
  count: number | string;
  key: keyof IGroupCounters;
}

const {
  Icon28PictureOutline,
  Icon28Attachments,
  Icon28Video,
  Icon28ArticleOutline,
} = icons;

export function useGroupCounters(groupRef: MaybeRef<IGroup>) {
  return computed((): IGroupCounter[] => {
    const group = unref(groupRef);
    const result: IGroupCounter[] = [];

    const add = (
      key: keyof IGroupCounters,
      icon: any,
      name: string,
      link: string,
      addAlways = false,
    ) => {
      let count: number | string | undefined = (() => {
        switch (key) {
          case "photos":
            return !group.counters?.photos ? "?" : group.counters.photos;
          default:
            return group.counters?.[key];
        }
      })();
      if (count || addAlways) {
        if (count === undefined) {
          count = 0;
        }

        result.push({
          key,
          icon,
          name,
          url: link,
          count,
        });
      }
    };

    add(
      "photos",
      Icon28PictureOutline,
      "Фотографий",
      `//vk.com/album-${group.id}_00`,
      true,
    );
    add("albums", Icon28Attachments, "Альбомов", `//vk.com/albums-${group.id}`);
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
