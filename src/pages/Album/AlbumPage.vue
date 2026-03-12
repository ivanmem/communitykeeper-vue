<script lang="ts" setup>
import { useAlbum } from "@/pages/Album/useAlbum";
import { useGroups } from "@/store/groups/groups";
import { computed } from "vue";
import FixedTeleport from "@/components/FixedTeleport";
import { useDialog } from "@/store/dialog/dialog";
import { computedAsync, refThrottled } from "@vueuse/core";
import { IGroup } from "@/store/groups/types";
import { useScreenSpinner } from "@/shared/composables/useScreenSpinner";
import AlbumPhoto from "@/pages/Album/AlbumPhoto.vue";
import ImagePreloader from "@/components/ImagePreloader";
import AlbumBreadcrumbs from "./AlbumBreadcrumbs.vue";
import AlbumControls from "./AlbumControls.vue";
import AlbumList from "./AlbumList.vue";
import {
  Icon24ErrorCircleOutline,
  Icon24InfoCircleOutline,
} from "vue-vkontakte-icons";
import { useI18n } from "vue-i18n";

const { t } = useI18n({
  messages: {
    ru: {
      noItems: "Элементы отсутствуют",
      helpTitle: "💡 Справка",
      helpText: `При просмотре фото нажмите по центру экрана, либо сделайте свайп вверх, чтобы выйти из просмотра.

Для перехода к предыдущему или следующему фото используйте:
- колёсико мыши;
- нажатия по краям экрана;
- проведите пальцем в нужную сторону.

Над фото нажмите правую кнопку мыши, либо удерживайте палец, чтобы открыть контекстное меню со следующим функционалом:
- перейти к фото;
- открыть оригинал;
- поделиться;
- скачать;
- поиск оригинала;
- отображать в оригинальном размере или расширить на весь экран;
- информация;
- открыть настройки пропуска фото по определённым условиям;

При просмотре фото сделайте свайп вниз, чтобы открыть дополнительную информацию.

Вы можете перейти в полноэкранный режим клавишей F11, либо нажатием по специальной кнопке справа от справки.`,
      positionLabel: "{position} из {total} фото",
    },
    en: {
      noItems: "No items",
      helpTitle: "💡 Help",
      helpText: `When viewing a photo, tap the center of the screen or swipe up to exit.

To go to the previous or next photo, use:
- mouse wheel;
- taps on the edges of the screen;
- swipe in the desired direction.

Right-click on the photo or long-press to open the context menu with the following features:
- go to photo;
- open original;
- share;
- download;
- search for original;
- display in original size or expand to full screen;
- information;
- open photo skip settings;

When viewing a photo, swipe down to open additional information.

You can enter fullscreen mode with F11 key or by clicking the button to the right of help.`,
      positionLabel: "{position} of {total} photos",
    },
  },
});

const props = defineProps<{
  ownerId: number | string;
  albumId: number | string;
  photoId: number | string | undefined;
}>();

const {
  photos,
  imagePreloader,
  previewPreloader,
  album,
  albumSize,
  albumIsEmpty,
  currentPhoto,
  setCurrentPhotoIndex,
  onScrollerUpdate,
  onSwitchPhoto,
  isInit,
  isLoadingPhotos,
  screenError,
  componentRef,
  albumPhotoRef,
  sizes,
  position,
} = useAlbum(
  () => props.ownerId,
  () => props.albumId,
  () => props.photoId,
);

const elementsIsEmpty = computed(
  () =>
    isInit.value &&
    !isLoadingPhotos.value &&
    !screenError.value &&
    albumIsEmpty.value,
);

const groupsStore = useGroups();
const dialogStore = useDialog();
const group = computedAsync<IGroup | undefined>(
  () => groupsStore.getGroupByIdOrLoad(-props.ownerId),
  undefined,
);

useScreenSpinner(() => !isInit.value);

const onHelp = () => {
  dialogStore.alert({
    title: t("helpTitle"),
    subtitle: t("helpText"),
  });
};

const positionLabel = refThrottled(
  computed(() => {
    if (
      elementsIsEmpty.value ||
      screenError.value ||
      isNaN(position.value) ||
      (albumIsEmpty.value && isLoadingPhotos.value)
    ) {
      return undefined;
    }

    return t("positionLabel", {
      position: position.value,
      total: albumSize.value,
    });
  }),
  1000,
);
</script>

<template>
  <FixedTeleport to="#navigation-header__right">
    <VBtn :icon="Icon24InfoCircleOutline" variant="text" @click="onHelp" />
  </FixedTeleport>
  <div class="a-album">
    <template v-if="isInit">
      <div>
        <AlbumBreadcrumbs
          :album-id="albumId"
          :album-title="album?.title"
          :group="group"
          :owner-id="ownerId"
        />

        <AlbumControls
          :album-is-empty="albumIsEmpty"
          :is-loading-photos="isLoadingPhotos"
          :is-init="isInit"
          :position-label="positionLabel"
          :screen-error="screenError"
        />

        <VBanner
          v-if="elementsIsEmpty"
          :icon="Icon24ErrorCircleOutline"
          color="deep-purple-accent-4"
          lines="one"
        >
          <VBannerText>{{ t("noItems") }}</VBannerText>
        </VBanner>
      </div>

      <AlbumList
        v-model:component-ref="componentRef"
        :photos="photos"
        :sizes="sizes"
        @update:scroll="onScrollerUpdate"
        @select:photo="setCurrentPhotoIndex"
      />

      <AlbumPhoto
        v-if="currentPhoto"
        ref="albumPhotoRef"
        :photo="currentPhoto"
        :size="albumSize"
        :is-loading="currentPhoto.__state.index === -1"
        @photo:prev="onSwitchPhoto(false)"
        @photo:next="onSwitchPhoto(true)"
        @photo:exit="setCurrentPhotoIndex(undefined)"
      />
      <ImagePreloader :photos="previewPreloader.photos.value" />
      <ImagePreloader :photos="imagePreloader.photos.value" />
    </template>
  </div>
</template>

<style lang="scss">
.a-album {
  background: var(--vkui--color_background_content);
  color: var(--vkui--color_text_primary);
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  gap: 5px;
  overflow: auto;
}
</style>
