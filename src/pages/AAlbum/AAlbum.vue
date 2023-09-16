<script lang="ts" setup>
import { useAppCaption } from "@/composables/useAppCaption";
import AAlbumPreview from "@/pages/AAlbum/AAlbumPreview.vue";
import APhoto from "@/pages/AAlbum/APhoto.vue";
import { icons } from "@/common/consts";
import { PhotoHelper } from "@/helpers/PhotoHelper";
import { useAlbum } from "@/pages/AAlbum/useAlbum";
import { AlbumsPreviewSizes } from "@/pages/AAlbums/consts";
import { RecycleScroller } from "vue-virtual-scroller";
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
  albumCount,
  currentPhoto,
  setCurrentPhotoIndex,
  currentPhotoIndex,
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
useAppCaption("Галерея: Альбом");
const { Icon16Link } = icons;
const groupsStore = useGroups();
const albumUrl = computed(() =>
  PhotoHelper.getAlbumUrl(props.ownerId, props.albumId),
);
const ownerUrl = computed(() => PhotoHelper.getOwnerUrl(props.ownerId));
const group = computed(() => groupsStore.getGroupById(-props.ownerId));
</script>

<template>
  <div class="a-album vkuiGroup__inner Group__inner">
    <template v-if="isInit">
      <div style="padding-inline: 10px">
        <VBreadcrumbs density="compact" style="padding-left: 0">
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
            @click.prevent="openLink(`//${albumUrl}`)"
          />
        </VBreadcrumbs>
        <div
          style="display: flex; gap: 5px; align-items: center; flex-wrap: wrap"
        >
          <AButton
            class="opacity"
            icon="Icon24SortOutline"
            style="margin-left: auto"
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
        :index="currentPhotoIndex"
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
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: auto;
  gap: 5px;
  background: var(--vkui--color_background_content);
  color: var(--vkui--color_text_primary);
}

.a-album__items {
  flex-grow: 1;
  overflow-x: auto;
  justify-content: space-evenly;
}
</style>
