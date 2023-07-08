<script lang="ts" setup>
import { useAppCaption } from "@/composables/useAppCaption";
import AAlbumPreview from "@/pages/AAlbum/AAlbumPreview.vue";
import APhoto from "@/pages/AAlbum/APhoto.vue";
import { icons } from "@/common/consts";
import { PhotoHelper } from "@/helpers/PhotoHelper";
import { useAlbum } from "@/pages/AAlbum/useAlbum";
import { AlbumsPreviewSizes } from "@/pages/AAlbums/consts";
import { RecycleScroller } from "vue-virtual-scroller";
import { toNumberOrUndefined } from "@/helpers/toNumberOrUndefined";
import AButton from "@/components/AButton/AButton.vue";
import { useGroups } from "@/store/groups/groups";
import { openLink } from "@/helpers/openLink";
import { computed } from "vue";
import { router } from "@/router";

const props = defineProps<{
  ownerId: number | string;
  albumId: number | string;
  photoId: number | string | undefined;
}>();

const {
  photos,
  album,
  currentPhoto,
  setCurrentPhotoIndex,
  currentPhotoIndex,
  onScrollerUpdate,
  isInit,
  screenError,
  albumRef,
  gridItems,
  isLoadingPhotos,
  isLoadAllPhotos,
} = useAlbum(
  () => props.ownerId,
  () => props.albumId,
  () => props.photoId
);
useAppCaption("Галерея: Альбом");
const { Icon16Link } = icons;
const groupsStore = useGroups();
const albumUrl = computed(() =>
  PhotoHelper.getAlbumUrl(props.ownerId, props.albumId)
);
const ownerUrl = computed(() => PhotoHelper.getOwnerUrl(props.ownerId));
const group = computed(() => groupsStore.getGroupById(-props.ownerId));
</script>

<template>
  <div class="a-album vkuiGroup__inner Group__inner">
    <template v-if="isInit">
      <VBreadcrumbs style="padding-left: 0" density="compact">
        <VBreadcrumbsItem style="padding-left: 0" to="/">
          Группы
        </VBreadcrumbsItem>
        <VIcon size="small" icon="mdi-chevron-right" />
        <VBreadcrumbsItem
          :href="`https://${ownerUrl}`"
          :title="group?.name ?? 'Источник'"
          @click.prevent="router.replace(`/albums/${ownerId}`)"
        />
        <VIcon size="small" icon="mdi-chevron-right" />
        <VBreadcrumbsItem
          style="opacity: 0.7"
          :href="`https://${albumUrl}`"
          :title="album?.title ?? 'Альбом'"
          @click.prevent="openLink(`//${albumUrl}`)"
        />
      </VBreadcrumbs>
      <div
        style="display: flex; gap: 5px; align-items: center; flex-wrap: wrap"
      >
        <AButton
          style="margin-left: auto"
          class="opacity"
          icon="Icon24SortOutline"
          @click="
            groupsStore.config.reverseOrder = !groupsStore.config.reverseOrder
          "
          >{{
            groupsStore.config.reverseOrder
              ? "Показать в прямом порядке"
              : "Показать в обратном порядке"
          }}
        </AButton>
        <code v-if="screenError" class="vkuiFormField--status-error">
          {{ screenError }}
        </code>
      </div>
      <RecycleScroller
        ref="albumRef"
        class="a-album__items"
        :items="photos"
        :item-size="AlbumsPreviewSizes.height"
        :total-size="photos.length"
        :ready="!isLoadingPhotos"
        :itemSecondarySize="AlbumsPreviewSizes.width"
        :gridItems="gridItems"
        :updateInterval="100"
        emit-update
        key-field="id"
        @update="onScrollerUpdate"
        v-slot="{ item, index }"
      >
        <AAlbumPreview
          :key="item.id"
          :photo="item"
          :index="index"
          @click="setCurrentPhotoIndex(index)"
        />
      </RecycleScroller>
      <APhoto
        v-if="currentPhoto"
        :photo="currentPhoto"
        :count="
          toNumberOrUndefined(album?.size) ??
          (isLoadAllPhotos ? photos.length : `${photos.length}+`)
        "
        :index="currentPhotoIndex"
        @photo:prev="setCurrentPhotoIndex(currentPhotoIndex! - 1)"
        @photo:next="setCurrentPhotoIndex(currentPhotoIndex! + 1)"
        @photo:exit="setCurrentPhotoIndex(undefined)"
      />
    </template>
  </div>
</template>

<style lang="scss">
.a-album {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: auto;
  gap: 5px;
  background: var(--vkui--color_background_content);
  color: var(--vkui--color_text_primary);
  padding-inline: 10px;
}

.a-album__items {
  display: flex;
  flex-grow: 1;
  flex-direction: row;
  flex-wrap: wrap;
  gap: 10px;
  overflow-x: auto;
  justify-content: space-evenly;
  padding-block: 10px;
  flex-basis: 0;
}
</style>
