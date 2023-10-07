import { computed, unref } from "vue";
import { MaybeRef } from "@vueuse/core";
import { IGroup } from "@/store/groups/types";
import { icons } from "@/common/consts";

interface ICounter {
  icon: any;
  link: string;
  name: string;
  count: number | string;
}

const {
  Icon28PictureOutline,
  Icon28Attachments,
  Icon28Video,
  Icon28ArticleOutline,
} = icons;

export function useGroupCounters(groupRef: MaybeRef<IGroup>) {
  return computed((): ICounter[] => {
    const group = unref(groupRef);
    const result: ICounter[] = [];
    const add = (
      count: number | string | undefined,
      icon: any,
      name: string,
      link: string,
      addAlways = false,
    ) => {
      if (count || addAlways) {
        if (count === undefined) {
          count = 0;
        }

        result.push({
          icon,
          name,
          link,
          count,
        });
      }
    };

    add(
      !group.counters?.photos ? "?" : group.counters.photos,
      Icon28PictureOutline,
      "Фотографий",
      `//vk.com/album-${group.id}_00`,
      true,
    );
    add(
      group.counters?.albums,
      Icon28Attachments,
      "Альбомов",
      `//vk.com/albums-${group.id}`,
    );
    add(
      group.counters?.videos,
      Icon28Video,
      "Видеозаписей",
      `//vk.com/videos-${group.id}`,
    );
    add(
      group.counters?.articles,
      Icon28ArticleOutline,
      "Статей",
      `//vk.com/@public${group.id}`,
    );
    return result;
  });
}
