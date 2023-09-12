<script setup lang="ts">
import { useAppCaption } from "@/composables/useAppCaption";
import { useHistory } from "@/store/history/history";
import { computed } from "vue";
import { useGroups } from "@/store/groups/groups";
import { PhotoHelper } from "@/helpers/PhotoHelper";
import { IGroup } from "@/store/groups/types";
import { icons } from "@/common/consts";
import FixedTeleport from "@/components/FixedTeleport.vue";

useAppCaption("История");
const historyStore = useHistory();
const groupsStore = useGroups();

interface HistoryItemComputed {
  prependAvatar?: string | number;
  title: string | number;
  subtitle: string | number;
  to: string;
}

const items = computed<HistoryItemComputed[]>(() =>
  historyStore.historyArrayViewAlbum.map((item) => {
    const group: IGroup | undefined = groupsStore.getGroupById(-item.ownerId);
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
  }),
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
    <VBtn variant="text" :icon="icons.Icon16Delete" @click="onClear" />
  </FixedTeleport>
  <VCard class="overflow-block">
    <v-sheet
      v-if="items.length === 0"
      width="100%"
      class="pa-4 text-center mx-auto"
    >
      <h2 class="text-h5 mb-6">История просмотров отсутствует</h2>
      <v-divider class="mb-4"></v-divider>
    </v-sheet>
    <VList :items="items" item-props lines="two" density="compact">
      <template v-slot:subtitle="{ subtitle }">
        <div>{{ subtitle }}</div>
      </template>
    </VList>
  </VCard>
</template>
