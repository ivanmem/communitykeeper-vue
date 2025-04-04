<script lang="ts" setup>
import { useAlbum } from "@/pages/Album/useAlbum";
import { useGroups } from "@/store/groups/groups";
import { computed, toRef } from "vue";
import FixedTeleport from "@/components/FixedTeleport";
import { useDialog } from "@/store/dialog/dialog";
import { computedAsync, useThrottle } from "@vueuse/core";
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

useScreenSpinner(toRef(() => !group.value));

const onHelp = () => {
  dialogStore.alert({
    title: "💡 Справка",
    subtitle: `При просмотре фото нажмите по центру экрана, либо сделайте свайп вверх, чтобы выйти из просмотра.

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
  });
};

const positionLabel = useThrottle(
  computed(() => {
    if (
      elementsIsEmpty.value ||
      isNaN(position.value) ||
      (albumIsEmpty.value && isLoadingPhotos.value)
    ) {
      return undefined;
    }

    return `${position.value} из ${albumSize.value} фото`;
  }),
  1000,
);
</script>

<template>
  <FixedTeleport to="#navigation-header__right">
    <VBtn :icon="Icon24InfoCircleOutline" variant="text" @click="onHelp" />
  </FixedTeleport>
  <div class="a-album vkuiGroup__inner Group__inner">
    <template v-if="isInit && group">
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
          :position-label="positionLabel"
          :screen-error="screenError"
        />

        <VBanner
          v-if="elementsIsEmpty"
          :icon="Icon24ErrorCircleOutline"
          color="deep-purple-accent-4"
          lines="one"
        >
          <VBannerText>Элементы отсутствуют</VBannerText>
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
