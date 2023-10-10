<script lang="ts" setup>
import { useAppCaption } from "@/composables/useAppCaption";
import { useHistory } from "@/store/history/history";
import { computed } from "vue";
import { useGroups } from "@/store/groups/groups";
import { PhotoHelper } from "@/helpers/PhotoHelper";
import { IGroup } from "@/store/groups/types";
import { icons } from "@/common/consts";
import FixedTeleport from "@/components/FixedTeleport.vue";
import { from } from "linq-to-typescript";
import { openLink } from "@/helpers/openLink";

useAppCaption("История");
const historyStore = useHistory();
const groupsStore = useGroups();

interface HistoryItemComputed {
  prependAvatar?: string;
  title: string | number;
  subtitle: string | number;
  to?: string;
  onClick?: () => any;
}

const items = computed<HistoryItemComputed[]>(() =>
  from(historyStore.historyArray)
    .select((item) => {
      if (item.type === "view_album") {
        const group: IGroup | undefined = groupsStore.getGroupById(
          -item.ownerId,
        );
        const title = group?.name ?? item.ownerId;
        const prependAvatar = group?.photo_200;
        return {
          title,
          subtitle: `${
            item.subtitle || PhotoHelper.getAlbumUrl(item.ownerId, item.albumId)
          }`,
          prependAvatar,
          to: `/albums/${item.ownerId}/${item.albumId}/${item.photoId}`,
        };
      }

      if (item.type === "view_counter") {
        const group: IGroup | undefined = groupsStore.getGroupById(
          -item.ownerId,
        );
        const title = group?.name ?? item.ownerId;
        const prependAvatar = group?.photo_200;
        const subtitle = (() => {
          switch (item.counter) {
            case "photos":
              return "Фотографии";
            case "albums":
              return "Альбомы";
            case "videos":
              return "Видеозаписи";
            case "articles":
              return "Статьи";
            default:
              return item.url.replace("//", "");
          }
        })();
        return {
          title,
          subtitle,
          prependAvatar,
          onClick: () => {
            historyStore.add(item);
            openLink(item.url);
          },
        };
      }

      return undefined!;
    })
    .where(Boolean)
    .toArray(),
);

const onClear = () => {
  if (!window.confirm("Вы уверены, что хотите отчистить историю просмотров?")) {
    return;
  }

  historyStore.clear();
};
</script>
<template>
  <FixedTeleport to="#navigation-header__right">
    <VBtn :icon="icons.Icon16Delete" variant="text" @click="onClear" />
  </FixedTeleport>
  <VCard class="overflow-block">
    <v-sheet
      v-if="items.length === 0"
      class="pa-4 text-center mx-auto"
      width="100%"
    >
      <h2 class="text-h5 mb-6">История просмотров отсутствует</h2>
      <v-divider class="mb-4"></v-divider>
    </v-sheet>
    <VList :lines="'two'" density="compact">
      <VListItem
        v-for="item in items"
        :key="'' + item.title + item.subtitle + item.to"
        :prepend-avatar="item.prependAvatar"
        :subtitle="item.subtitle"
        :title="item.title"
        :to="item.to"
        @click="item.onClick"
      ></VListItem>
    </VList>
  </VCard>
</template>
