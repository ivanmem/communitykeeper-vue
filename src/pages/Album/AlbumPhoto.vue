<script lang="ts" setup>
import {
  computed,
  nextTick,
  onDeactivated,
  onWatcherCleanup,
  ref,
  toRef,
  watch,
} from "vue";
import { PhotoHelper } from "@/shared/helpers/PhotoHelper";
import { actionSwipesDict, dateTimeFormatter } from "@/shared/constants/consts";
import { GallerySwipesConfig, useGroups } from "@/store/groups/groups";
import { useApp } from "@/store/app/app";
import useClipboard from "vue-clipboard3";
import { UsableSwipesOptions } from "@/shared/composables/useSwipes";
import { useDialog } from "@/store/dialog/dialog";
import { usePhotoActions } from "@/pages/Album/usePhotoActions";
import { useSwipesAndZoom } from "@/shared/composables/useSwipesAndZoom";
import { UsableZoomOptions } from "@/shared/composables/useZoom";
import PhotoCounter from "@/pages/Album/PhotoCounter.vue";
import { IPhoto } from "@/store/groups/types";
import { useThrottleFn } from "@vueuse/core";

const emit = defineEmits<{
  (e: "photo:prev"): void;
  (e: "photo:next"): void;
  (e: "photo:exit"): void;
}>();

export type IPhotoEmit = typeof emit;

const props = defineProps<{
  photo: IPhoto;
  size?: number | string;
}>();

const appStore = useApp();
const dialogStore = useDialog();
const groupsStore = useGroups();
const photoDiv = ref<HTMLDivElement>();
const imageRef = ref<HTMLImageElement>();
const showInfo = ref(true);
const showMoreInfo = ref(false);
const originalSize = computed(() =>
  PhotoHelper.getOriginalSize(props.photo.sizes),
);
const actions = usePhotoActions(
  () => props.photo,
  showMoreInfo,
  emit,
  photoDiv,
);

const onClick = (event: MouseEvent) => {
  const clickX = event.offsetX;

  const imageWidth = (event.target as HTMLDivElement).clientWidth;
  const centerWidth = imageWidth / 3;
  if (clickX >= centerWidth && clickX <= centerWidth * 2) {
    emit("photo:exit");
    return;
  }

  const imageCenterX = imageWidth / 2;
  // Сравниваем координату клика с центром изображения
  if (clickX <= imageCenterX) {
    emit("photo:prev");
    return;
  }

  emit("photo:next");
  return;
};

watch(
  [photoDiv, () => useApp().isFullScreen, showMoreInfo],
  () => {
    if (showMoreInfo.value) {
      return;
    }

    nextTick(() => {
      if (photoDiv.value) {
        photoDiv.value.focus();
      }
    });
  },
  { immediate: true },
);

watch(
  () => props.photo,
  () => {
    showInfo.value = true;

    const timeoutShowInfo = setTimeout(() => {
      showInfo.value = false;
    }, 2000);

    onWatcherCleanup(() => {
      clearTimeout(timeoutShowInfo);
    });
  },
  { immediate: true },
);

const onWheel = useThrottleFn(
  (e: WheelEvent) => {
    const delta = e.deltaY || e.detail;
    if (delta > 0) {
      actions.onPhotoNext();
    } else {
      actions.onPhotoPrev();
    }
  },
  () => (appStore.isMacOS ? 100 : 20),
);

const swipesConfig = toRef(() => groupsStore.swipesConfig);
const swipesOptions: UsableSwipesOptions = {
  onContextMenu: actions.onShowContextMenu,
};
const zoomOpts: UsableZoomOptions = {
  image: imageRef,
  key: () => props.photo.id,
  enabled: ref(false),
};

watch(
  swipesConfig,
  () => {
    for (const key in swipesConfig.value) {
      const swipeKey = key as keyof GallerySwipesConfig;
      const name = actionSwipesDict.get(swipesConfig.value[swipeKey])?.name!;
      swipesOptions[swipeKey] = actions[name];
    }
  },
  { immediate: true },
);

const swipes = useSwipesAndZoom(swipesOptions, zoomOpts);

const { toClipboard } = useClipboard({ appendToBody: true });

const dateTime = computed(() => {
  return dateTimeFormatter.format(new Date(props.photo.date * 1000));
});

onDeactivated(() => {
  showMoreInfo.value = false;
});

defineExpose({
  photoDiv,
});
</script>
<template>
  <div
    ref="photoDiv"
    class="a-not-draggable-and-not-select a-photo"
    tabindex="1"
    @click="onClick"
    v-on="swipes"
    @keydown.stop.prevent.esc="emit('photo:exit')"
    @keydown.stop.prevent.space="emit('photo:exit')"
    @keydown.stop.prevent.left="emit('photo:prev')"
    @keydown.stop.prevent.right="emit('photo:next')"
    @wheel.prevent.stop="onWheel"
    @click.middle="emit('photo:exit')"
  >
    <img
      v-if="originalSize"
      :key="originalSize.url"
      ref="imageRef"
      :data-original-size-photo="groupsStore.config.originalSizePhoto"
      :src="originalSize.url"
      alt=""
    />
    <PhotoCounter
      :size="size"
      :date-time="dateTime"
      :photo-index="photo.__state.index"
      :show-info="showInfo"
      class="a-photo__info-top-left"
    />
  </div>
  <VDialog v-model="showMoreInfo" close-on-back>
    <VCard>
      <VCardTitle>Расширенная информация</VCardTitle>
      <VCardText>
        <div>
          Дата: <b>{{ dateTime }}</b>
        </div>
        <div v-if="photo.text">
          Описание: <b>{{ photo.text }}</b>
        </div>
        <div v-if="originalSize">
          Разрешение: <b>{{ originalSize.width }}x{{ originalSize.height }}</b>
        </div>
        <div v-if="photo.likes">
          Лайков: <b>{{ photo.likes.count }}</b>
        </div>
        <div v-if="photo.comments">
          Комментариев: <b>{{ photo.comments.count }}</b>
        </div>
        <div v-if="photo.reposts">
          Репостов: <b>{{ photo.reposts.count }}</b>
        </div>
        <div v-if="photo.tags">
          Тегов: <b>{{ photo.tags.count }}</b>
        </div>
      </VCardText>

      <VExpansionPanels>
        <VExpansionPanel title="JSON">
          <template #text>
            <VCode
              @click="
                toClipboard(JSON.stringify(photo), $event.target);
                dialogStore.alert('JSON скопирован в буфер.');
              "
            >
              {{ photo }}
            </VCode>
          </template>
        </VExpansionPanel>
      </VExpansionPanels>
    </VCard>
  </VDialog>
</template>
<style lang="scss">
.a-photo {
  align-items: center;
  background-color: black;
  bottom: 0;
  cursor: pointer;
  display: flex;
  justify-content: center;
  left: 0;
  position: fixed;
  right: 0;
  top: 0;
  touch-action: none;
  vertical-align: top;
  z-index: 1;
  scroll-behavior: auto;

  * {
    scroll-behavior: auto;
  }

  img {
    align-content: center;
    display: flex;
    flex-grow: 1;
    height: auto;
    justify-content: center;
    max-height: 100%;
    max-width: 100%;
    object-fit: contain;
    pointer-events: none;
    width: auto;

    &[data-original-size-photo="true"] {
      flex-grow: 0;
      zoom: calc(1 / var(--device-pixel-ratio));
    }
  }
}

.a-photo__info-top-left,
.a-photo__info-top-right {
  margin-left: 15px;
  margin-top: 10px;
  pointer-events: none;
  position: absolute;
  z-index: 2;
}

.a-photo__info-top-left {
  left: env(safe-area-inset-left, 0);
  top: env(safe-area-inset-top, 0);
}

.a-photo__info-top-right {
  right: env(safe-area-inset-right, 0);
  top: env(safe-area-inset-top, 0);
}
</style>
