<script lang="ts" setup>
import { computed, h, nextTick, onDeactivated, ref, watch } from "vue";
import { PhotoHelper } from "@/helpers/PhotoHelper";
import { showContextMenu } from "@/helpers/showContextMenu";
import { openUrl } from "@/helpers/openUrl";
import { dateTimeFormatter, icons, styledIcons } from "@/common/consts";
import { MenuItem } from "@imengyu/vue3-context-menu";
import { useGroups } from "@/store/groups/groups";
import { useApp } from "@/store/app/app";
import { IPhoto } from "@/store/groups/types";
import useClipboard from "vue-clipboard3/dist/esm/index";
import { useSwipes } from "@/composables/useSwipes";
import { useDialog } from "@/store/dialog/dialog";
import APhotoShareDialog, {
  APhotoShareDialogProps,
} from "@/pages/AAlbum/APhotoShareDialog.vue";
import APhotoCounter from "@/pages/AAlbum/APhotoCounter.vue";

const emit = defineEmits<{
  (e: "photo:prev"): void;
  (e: "photo:next"): void;
  (e: "photo:exit"): void;
}>();

const props = defineProps<{
  photo: IPhoto;
  count?: number | string;
}>();

const originalSize = computed(() =>
  PhotoHelper.getOriginalSize(props.photo.sizes),
);

const groupsStore = useGroups();

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
const photoDiv = ref<HTMLDivElement>();
const showInfo = ref(true);
const showMoreInfo = ref(false);
const dialogStore = useDialog();

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

let timeoutShowInfo: any = undefined;

watch(
  () => props.photo,
  () => {
    clearTimeout(timeoutShowInfo);
    showInfo.value = true;
    timeoutShowInfo = setTimeout(() => {
      showInfo.value = false;
    }, 2000);
  },
  { immediate: true },
);

const onShowContextMenu = (e: MouseEvent | TouchEvent) => {
  const items: MenuItem[] = [];

  items.push({
    label: "Перейти к фото",
    icon: h(icons.Icon16LogoVk),
    onClick: () => {
      openUrl(
        `//${PhotoHelper.getPhotoUrl(props.photo.owner_id, props.photo.id)}`,
      );
    },
  });
  items.push({
    label: "Открыть оригинал",
    icon: h(icons.Icon16Link),
    onClick: () => {
      if (originalSize.value) {
        openUrl(originalSize.value.url);
      }
    },
  });
  items.push({
    label: "Поделиться",
    icon: h(icons.Icon16Share),
    onClick: () => {
      dialogStore.open<APhotoShareDialogProps>({
        component: APhotoShareDialog,
        props: { photo: props.photo },
      });
    },
  });
  items.push({
    label: "Скачать",
    icon: h(icons.Icon16DownloadOutline),
    onClick: () => {
      return PhotoHelper.downloadPhoto(props.photo);
    },
  });
  items.push({
    label: "Поиск оригинала",
    icon: h(icons.Icon16SearchStarsOutline),
    onClick: async () => {
      const isUseYandex = await useDialog().confirm({
        title: "Поиск оригинала",
        subtitle: `Выберите поисковую систему:`,
        confirmTitle: "Yandex",
        cancelTitle: "SauceNAO",
        persistent: true,
      });
      const url = encodeURIComponent(originalSize.value!.url);
      if (isUseYandex) {
        openUrl(`https://yandex.com/images/search?rpt=imageview&url=${url}`);
      } else {
        openUrl(`https://saucenao.com/search.php?url=${url}`);
      }
    },
  });

  items.push({
    label: groupsStore.config.originalSizePhoto
      ? `Расширить на весь экран`
      : "Отображать в оригинальном размере",
    icon: groupsStore.config.originalSizePhoto
      ? styledIcons.Icon16Fullscreen
      : styledIcons.Icon16FullscreenExit,
    onClick: () => {
      groupsStore.config.originalSizePhoto =
        !groupsStore.config.originalSizePhoto;
    },
  });
  items.push({
    label: "Информация",
    icon: h(icons.Icon16ArticleOutline),
    onClick: () => {
      showMoreInfo.value = true;
    },
  });
  items.push({
    label: `${
      groupsStore.config.skipLowResolutionPhotos
        ? "Не пропускать"
        : "Пропускать"
    } фото с маленьким размером`,
    icon: styledIcons.Icon16SkipToAction,
    onClick: () => {
      groupsStore.config.skipLowResolutionPhotos =
        !groupsStore.config.skipLowResolutionPhotos;
    },
  });
  items.push({
    label: "Выйти из просмотра фото",
    icon: h(icons.Icon16DoorEnterArrowRightOutline),
    onClick: () => {
      emit("photo:exit");
    },
  });
  showContextMenu(e, items, () => photoDiv.value?.focus());
};

const onWheel = (e: WheelEvent) => {
  const delta = e.deltaY || e.detail;
  if (delta > 0) {
    emit("photo:next");
  } else {
    emit("photo:prev");
  }
};

const swipes = useSwipes({
  onLeft: () => emit("photo:prev"),
  onRight: () => emit("photo:next"),
  onDown: () => emit("photo:exit"),
  onUp: () => (showMoreInfo.value = true),
  onContextMenu: onShowContextMenu,
});

const { toClipboard } = useClipboard({ appendToBody: true });
const win = window;

const dateTime = computed(() => {
  return dateTimeFormatter.format(new Date(props.photo.date * 1000));
});

onDeactivated(() => {
  showMoreInfo.value = false;
});
</script>
<template>
  <div
    ref="photoDiv"
    class="a-not-dragable-and-not-select a-photo"
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
      :data-original-size-photo="groupsStore.config.originalSizePhoto"
      :src="originalSize.url"
      alt=""
    />
    <APhotoCounter
      :count="count"
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
          Тэгов: <b>{{ photo.tags.count }}</b>
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
  vertical-align: top;
  z-index: 1;

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
