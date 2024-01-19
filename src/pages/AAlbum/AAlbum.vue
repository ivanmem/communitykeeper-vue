<script lang="ts" setup>
import AAlbumPreview from "@/pages/AAlbum/AAlbumPreview.vue";
import APhoto from "@/pages/AAlbum/APhoto.vue";
import { icons, styledIcons } from "@/common/consts";
import { PhotoHelper } from "@/helpers/PhotoHelper";
import { useAlbum } from "@/pages/AAlbum/useAlbum";
import { AlbumsPreviewSizes } from "@/pages/AAlbums/consts";
import { RecycleScroller } from "vue-virtual-scroller";
import { useGroups } from "@/store/groups/groups";
import { openUrl } from "@/helpers/openUrl";
import { computed } from "vue";
import { router } from "@/router";
import FixedTeleport from "@/components/FixedTeleport.vue";
import { useDialog } from "@/store/dialog/dialog";

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
} = useAlbum(
  () => props.ownerId,
  () => props.albumId,
  () => props.photoId,
);
const { Icon16Link } = icons;
const groupsStore = useGroups();
const dialogStore = useDialog();
const albumUrl = computed(() =>
  PhotoHelper.getAlbumUrl(props.ownerId, props.albumId),
);
const ownerUrl = computed(() => PhotoHelper.getOwnerUrl(props.ownerId));
const group = computed(() => groupsStore.getGroupById(-props.ownerId));

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
- скачать;
- поделиться;
- поиск оригинала;
- отображать в оригинальном размере;
- пропускать фото с маленьким размером.

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
    <template v-if="isInit">
      <div style="padding-inline: 16px">
        <VBreadcrumbs density="compact">
          <VBreadcrumbsItem style="padding-left: 0" to="/">
            Группы
          </VBreadcrumbsItem>
          <VIcon icon="mdi-chevron-right" size="small" />
          <VBreadcrumbsItem
            :href="`https://${ownerUrl}`"
            :title="group?.name ?? 'Источник'"
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
          <code v-if="screenError" class="vkuiFormField--status-error">
            {{ screenError }}
          </code>
          <VSpacer />
          <VSwitch
            v-model="groupsStore.config.reverseOrder"
            :false-icon="styledIcons.Icon24SortOutlineOpacity50"
            :true-icon="icons.Icon24SortOutline"
            hide-details
            label="В обратном порядке"
            style="flex-grow: 0"
          />
        </div>
      </div>
      <RecycleScroller
        ref="albumRef"
        v-slot="{ item, index }"
        :gridItems="gridItems"
        :item-size="AlbumsPreviewSizes.height"
        :itemSecondarySize="AlbumsPreviewSizes.width"
        :items="photos"
        :min-item-size="AlbumsPreviewSizes.height"
        :ready="!isLoadingPhotos"
        :total-size="photos.length"
        class="a-album__items"
        emit-update
        key-field="id"
        @update="onScrollerUpdate"
      >
        <AAlbumPreview
          :key="item.id"
          :index="index"
          :photo="item"
          @click="setCurrentPhotoIndex(index)"
        />
      </RecycleScroller>
      <APhoto
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

.a-album__items {
  flex-grow: 1;
  justify-content: space-evenly;
  overflow-x: auto;
  overflow-y: scroll !important;

  &::-webkit-scrollbar {
    width: 0px;
  }
}
</style>
