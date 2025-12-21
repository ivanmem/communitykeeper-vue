<script lang="ts" setup>
import { useHistory } from "@/store/history/history";
import { computed, toRef } from "vue";
import { useGroups } from "@/store/groups/groups";
import { IGroup } from "@/store/groups/types";
import FixedTeleport from "@/components/FixedTeleport";
import { from } from "linq-to-typescript";
import { useDialog } from "@/store/dialog/dialog";
import { useSmartOpenUrl } from "@/shared/composables/useSmartOpenLink";
import { computedAsync } from "@vueuse/core";
import { useScreenSpinner } from "@/shared/composables/useScreenSpinner";
import { PhotoHelper } from "@/shared/helpers/PhotoHelper";
import {
  Icon24DeleteOutline,
  Icon24InfoCircleOutline,
} from "vue-vkontakte-icons";
import { useI18n } from "vue-i18n";
import { useAppCaption } from "@/shared/composables/useAppCaption";

const { t } = useI18n({
  messages: {
    ru: {
      title: "История",
      clearHistory: "Очистить историю просмотров",
      noItems: "Элементы отсутствуют",
      photos: "Фотографии",
      albums: "Альбомы",
      videos: "Видеозаписи",
      articles: "Статьи",
      clearTitle: "Очистка истории просмотров",
      clearConfirm: "Вы уверены, что хотите очистить историю просмотров?",
      helpTitle: "💡 Справка",
      helpText: `Переключатель "Встроенная галерея" из настроек здесь не применяется. При нажатии запись откроется так же, как была открыта в момент сохранения в историю.

История обнуляется при каждом обновлении приложения, так как VK меняет домен при публикации.

Размер истории ограничен {maxSize} символами (примерно {approxRecords} записей).

История хранится на Вашем устройстве.`,
    },
    en: {
      title: "History",
      clearHistory: "Clear view history",
      noItems: "No items",
      photos: "Photos",
      albums: "Albums",
      videos: "Videos",
      articles: "Articles",
      clearTitle: "Clear view history",
      clearConfirm: "Are you sure you want to clear view history?",
      helpTitle: "💡 Help",
      helpText: `The "Built-in gallery" toggle from settings does not apply here. When clicked, the entry will open the same way it was opened when saved to history.

History is reset with each app update, as VK changes the domain on publish.

History size is limited to {maxSize} characters (approximately {approxRecords} records).

History is stored on your device.`,
    },
  },
});

useAppCaption(computed(() => t("title")));

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
              return t("photos");
            case "albums":
              return t("albums");
            case "videos":
              return t("videos");
            case "articles":
              return t("articles");
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
    title: t("clearTitle"),
    subtitle: t("clearConfirm"),
  });
  if (!result) {
    return;
  }

  historyStore.clear();
};

const onHelp = () => {
  dialogStore.alert({
    title: t("helpTitle"),
    subtitle: t("helpText", {
      maxSize: historyStore.maxSize,
      approxRecords: Math.floor(historyStore.maxSize / 110),
    }),
  });
};
</script>
<template>
  <FixedTeleport to="#navigation-header__right">
    <VBtn
      :icon="Icon24DeleteOutline"
      :title="t('clearHistory')"
      variant="text"
      @click="onClear"
    />
    <VBtn :icon="Icon24InfoCircleOutline" variant="text" @click="onHelp" />
  </FixedTeleport>
  <VCard v-if="items !== undefined" class="overflow-block">
    <VSheet
      v-if="items.length === 0"
      class="pa-4 text-center mx-auto"
      width="100%"
    >
      <h2 class="text-h5 mb-6">{{ t("noItems") }}</h2>
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
