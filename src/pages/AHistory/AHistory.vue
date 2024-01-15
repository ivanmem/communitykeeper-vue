<script lang="ts" setup>
import { useHistory } from "@/store/history/history";
import { computed } from "vue";
import { useGroups } from "@/store/groups/groups";
import { PhotoHelper } from "@/helpers/PhotoHelper";
import { IGroup } from "@/store/groups/types";
import { icons } from "@/common/consts";
import FixedTeleport from "@/components/FixedTeleport.vue";
import { from } from "linq-to-typescript";
import { useDialog } from "@/store/dialog/dialog";
import { useSmartOpenUrl } from "@/composables/useSmartOpenLink";

const historyStore = useHistory();
const groupsStore = useGroups();
const dialogStore = useDialog();
const smartOpenUrl = useSmartOpenUrl();

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
            smartOpenUrl(item.url);
          },
        };
      }

      return undefined!;
    })
    .where(Boolean)
    .toArray(),
);

const onClear = async () => {
  const result = await dialogStore.confirm({
    title: "Очистка истории просмотров",
    subtitle: "Вы уверены, что хотите отчистить историю просмотров?",
  });
  if (!result) {
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
      <template
        v-for="(item, i) in items"
        :key="'' + item.title + item.subtitle + item.to"
      >
        <VListItem
          :prepend-avatar="item.prependAvatar"
          :subtitle="item.subtitle"
          :title="item.title"
          :to="item.to"
          @click="item.onClick"
        />
        <VDivider v-if="items.length - 1 > i" />
      </template>
    </VList>
  </VCard>
</template>
