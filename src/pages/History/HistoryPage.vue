<script lang="ts" setup>
import { useHistory } from "@/store/history/history";
import { toRef } from "vue";
import { useGroups } from "@/store/groups/groups";
import { IGroup } from "@/store/groups/types";
import { icons } from "@/shared/constants/consts";
import FixedTeleport from "@/components/FixedTeleport";
import { from } from "linq-to-typescript";
import { useDialog } from "@/store/dialog/dialog";
import { useSmartOpenUrl } from "@/shared/composables/useSmartOpenLink";
import { computedAsync } from "@vueuse/core";
import { useScreenSpinner } from "@/shared/composables/useScreenSpinner";
import { PhotoHelper } from "@/shared/helpers/PhotoHelper";

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

const items = computedAsync<HistoryItemComputed[] | undefined>(() =>
  from(historyStore.historyArray)
    .selectAsync(async (item) => {
      if (item.type === "va") {
        const group: IGroup | undefined = await groupsStore.getGroupByIdOrLoad(
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

      if (item.type === "vc") {
        const group: IGroup | undefined = await groupsStore.getGroupByIdOrLoad(
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

useScreenSpinner(toRef(() => items.value === undefined));

const onClear = async () => {
  const result = await dialogStore.confirm({
    title: "Очистка истории просмотров",
    subtitle: "Вы уверены, что хотите очистить историю просмотров?",
  });
  if (!result) {
    return;
  }

  historyStore.clear();
};

const onHelp = () => {
  dialogStore.alert({
    title: "💡 Справка",
    subtitle:
      `Переключатель "Встроенная галерея" из настроек здесь не применяется. При нажатии запись откроется так же, как была открыта в момент сохранения в историю.` +
      `\n\nИстория обнуляется при каждом обновлении приложения, так как VK меняет домен при публикации.` +
      `\n\nРазмер истории ограничен ${historyStore.maxSize} символами (примерно ${Math.floor(historyStore.maxSize / 110)} записей).` +
      `\n\nИстория хранится на Вашем устройстве.`,
  });
};
</script>
<template>
  <FixedTeleport to="#navigation-header__right">
    <VBtn
      :icon="icons.Icon24DeleteOutline"
      title="Очистить историю просмотров"
      variant="text"
      @click="onClear"
    />
    <VBtn
      :icon="icons.Icon24InfoCircleOutline"
      variant="text"
      @click="onHelp"
    />
  </FixedTeleport>
  <VCard v-if="items !== undefined" class="overflow-block">
    <VSheet
      v-if="items.length === 0"
      class="pa-4 text-center mx-auto"
      width="100%"
    >
      <h2 class="text-h5 mb-6">Элементы отсутствуют</h2>
      <VDivider class="mb-4"></VDivider>
    </VSheet>
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
