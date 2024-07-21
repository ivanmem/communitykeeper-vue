<script lang="ts" setup>
import GroupHelper from "@/shared/helpers/GroupHelper";
import { openUrl } from "@/shared/helpers/openUrl";
import { PhotoHelper } from "@/shared/helpers/PhotoHelper";
import { icons, styledIcons } from "@/shared/constants/consts";
import { useAlbum } from "@/pages/Album/useAlbum";
import { useGroups } from "@/store/groups/groups";
import { computed, toRef } from "vue";
import { router } from "@/router";
import FixedTeleport from "@/components/FixedTeleport";
import { useDialog } from "@/store/dialog/dialog";
import { computedAsync } from "@vueuse/core";
import { IGroup } from "@/store/groups/types";
import { useScreenSpinner } from "@/shared/composables/useScreenSpinner";
// @ts-ignore
import { VList } from "virtua/vue";
import AlbumPreview from "@/pages/Album/AlbumPreview.vue";
import AlbumPhoto from "@/pages/Album/AlbumPhoto.vue";

const props = defineProps<{
  ownerId: number | string;
  albumId: number | string;
  photoId: number | string | undefined;
}>();

const {
  photos,
  album,
  albumCount,
  currentPhoto,
  setCurrentPhotoIndex,
  onScrollerUpdate,
  onSwitchPhoto,
  isInit,
  screenError,
  albumRef,
  gridItems,
  isLoadingPhotos,
  sizes,
  position,
} = useAlbum(
  () => props.ownerId,
  () => props.albumId,
  () => props.photoId,
);
const groupsStore = useGroups();
const dialogStore = useDialog();
const albumUrl = computed(() =>
  PhotoHelper.getAlbumUrl(props.ownerId, props.albumId),
);
const ownerUrl = computed(() => PhotoHelper.getOwnerUrl(props.ownerId));
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
- пропускать фото с маленьким размером или не пропускать.

При просмотре фото сделайте свайп вниз, чтобы открыть дополнительную информацию.

Вы можете перейти в полноэкранный режим клавишей F11, либо нажатием по специальной кнопке справа от справки.`,
  });
};
</script>

<template>
  <FixedTeleport to="#navigation-header__right">
    <VBtn :icon="icons.Icon16InfoCircle" variant="text" @click="onHelp" />
  </FixedTeleport>
  <div class="a-album vkuiGroup__inner Group__inner">
    <template v-if="isInit && group">
      <div style="padding-inline: 16px">
        <VBreadcrumbs density="compact">
          <VBreadcrumbsItem style="padding-left: 0" to="/">
            Группы
          </VBreadcrumbsItem>
          <VIcon icon="mdi-chevron-right" size="small" />
          <VBreadcrumbsItem
            :href="`https://${ownerUrl}`"
            :title="GroupHelper.getName(group)"
            @click.prevent="router.replace(`/albums/${ownerId}`)"
          />
          <VIcon icon="mdi-chevron-right" size="small" />
          <VBreadcrumbsItem
            :href="`https://${albumUrl}`"
            :title="album?.title ?? 'Альбом'"
            style="opacity: 0.7"
            @click.prevent="openUrl(`//${albumUrl}`)"
          />
        </VBreadcrumbs>
        <div
          style="display: flex; gap: 5px; align-items: center; flex-wrap: wrap"
        >
          <div v-if="album && (position != 0 || album.size === 0)" class="a-album__position">
            {{ position }} из {{ album.size }} фото
          </div>
          <code v-if="screenError" class="vkuiFormField--status-error">
            {{ screenError }}
          </code>
          <VSpacer />
          <VSwitch
            v-if="!screenError"
            v-model="groupsStore.config.reverseOrder"
            :false-icon="styledIcons.Icon24SortOutlineOpacity50"
            :true-icon="icons.Icon24SortOutline"
            class="a-album__reverse-order"
            hide-details
            label="В обратном порядке"
            style="flex-grow: 0;"
          />
        </div>
      </div>
      <VList
        ref="albumRef"
        #default="indexes"
        :data="photos.indexes"
        class="a-album__items"
        @range-change="onScrollerUpdate"
      >
        <div class="a-album-row">
          <AlbumPreview
            v-for="index in indexes"
            :key="photos.items[index].id"
            :index="index"
            :photo="photos.items[index]"
            :sizes="sizes"
            @click="setCurrentPhotoIndex(index)"
          />
        </div>
      </VList>
      <AlbumPhoto
        v-if="currentPhoto"
        :count="albumCount"
        :photo="currentPhoto"
        @photo:prev="onSwitchPhoto('prev')"
        @photo:next="onSwitchPhoto('next')"
        @photo:exit="setCurrentPhotoIndex(undefined)"
      />
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

.a-album-row {
  display: flex;
}

.a-album__items {
  flex-grow: 1;
  justify-content: space-evenly;
  overflow-x: auto;
  overflow-y: scroll !important;

  &::-webkit-scrollbar {
    width: 0px;
  }
}

.a-album__position {
  font-size: 12px;
}

.a-album__reverse-order {
  .v-label {
    font-size: 12px;
  }
}
</style>
