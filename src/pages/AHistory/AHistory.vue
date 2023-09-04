<script setup lang="ts">
import { useAppCaption } from "@/composables/useAppCaption";
import { useHistory } from "@/store/history/history";
import { computed } from "vue";
import { useGroups } from "@/store/groups/groups";
import { PhotoHelper } from "@/helpers/PhotoHelper";
import { IGroup } from "@/store/groups/types";

useAppCaption("История");
const historyStore = useHistory();
const groupsStore = useGroups();

interface HistoryItemComputed {
  prependAvatar?: string | number;
  title: string | number;
  subtitle: string | number;
  to: string;
}

const items = computed<HistoryItemComputed[]>(() => {
  return historyStore.historyArray.map((item) => {
    const group: IGroup | undefined = groupsStore.getGroupById(-item.ownerId);
    const title = group?.name ?? item.ownerId;
    const prependAvatar = group?.photo_200;
    if (item.type === "view_owner") {
      return {
        title,
        subtitle: `${PhotoHelper.getOwnerUrl(item.ownerId)}`,
        prependAvatar,
        to: `/albums/${item.ownerId}`,
      };
    }

    if (item.type === "view_album") {
      return {
        title,
        subtitle: `${PhotoHelper.getAlbumUrl(item.ownerId, item.albumId)}`,
        prependAvatar,
        to: `/albums/${item.ownerId}/${item.albumId}/${item.photoId}`,
      };
    }

    throw new Error("Неизвестный тип: " + (item as any).type);
  });
});
</script>
<template>
  <VCard class="overflow-block">
    <v-sheet
      v-if="items.length === 0"
      width="100%"
      class="pa-4 text-center mx-auto"
    >
      <h2 class="text-h5 mb-6">История просмотров отсутствует</h2>
      <v-divider class="mb-4"></v-divider>
    </v-sheet>
    <VList :items="items" item-props lines="three">
      <template v-slot:subtitle="{ subtitle }">
        <div>{{ subtitle }}</div>
      </template>
    </VList>
  </VCard>
</template>
