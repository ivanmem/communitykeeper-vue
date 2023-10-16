<script lang="ts" setup>
import { computed, h, nextTick, ref, watch } from "vue";
import { PhotoHelper } from "@/helpers/PhotoHelper";
import { showContextMenu } from "@/helpers/showContextMenu";
import { openLink } from "@/helpers/openLink";
import { dateTimeFormatter, icons } from "@/common/consts";
import { saveAs } from "file-saver";
import { MenuItem } from "@imengyu/vue3-context-menu";
import { useGroups } from "@/store/groups/groups";
import bridge from "@vkontakte/vk-bridge";
import { useApp } from "@/store/app/app";
import { IPhoto } from "@/store/groups/types";
import useClipboard from "vue-clipboard3/dist/esm/index";
import { useSwipes } from "@/composables/useSwipes";

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

const h16 = (icon: any) => h(icon, { width: "16px", height: "16px" });

const onShowContextMenu = (e: MouseEvent) => {
  const items: MenuItem[] = [];

  items.push({
    label: "Перейти к фото",
    icon: h(icons.Icon16LogoVk),
    onClick: () => {
      openLink(
        `//${PhotoHelper.getPhotoUrl(props.photo.owner_id, props.photo.id)}`,
      );
    },
  });
  items.push({
    label: "Открыть оригинал",
    icon: h(icons.Icon16Link),
    onClick: () => {
      if (originalSize.value) {
        openLink(originalSize.value.url);
      }
    },
  });
  items.push({
    label: "Поделиться",
    icon: h(icons.Icon16Share),
    onClick: () => {
      bridge.send("VKWebAppShowWallPostBox", {
        message: "",
        attachments: originalSize.value?.url,
      });
    },
  });
  items.push({
    label: "Скачать",
    icon: h(icons.Icon16DownloadOutline),
    onClick: () => {
      if (originalSize.value) {
        saveAs(
          originalSize.value.url,
          PhotoHelper.getPhotoFileName(props.photo),
        );
      }
    },
  });
  items.push({
    label: "Найти оригинал",
    icon: h(icons.Icon16SearchStarsOutline),
    onClick: () => {
      const isUseYandex = confirm(
        "Подтвердите для поиска с помощью яндекса. Отмените для поиска с помощью saucenao.",
      );
      const url = escape(originalSize.value!.url);
      if (isUseYandex) {
        openLink(`https://yandex.com/images/search?rpt=imageview&url=${url}`);
      } else {
        openLink(`https://saucenao.com/search.php?url=${url}`);
      }
    },
  });

  items.push({
    label: groupsStore.config.originalSizePhoto
      ? `Расширить на весь экран`
      : "Отображать в оригинальном размере",
    icon: h16(
      groupsStore.config.originalSizePhoto
        ? icons.Icon24Fullscreen
        : icons.Icon24FullscreenExit,
    ),
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
    icon: h16(icons.Icon24SkipToAction),
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
});

const { toClipboard } = useClipboard({ appendToBody: true });
const win = window;

const dateTime = computed(() => {
  return dateTimeFormatter.format(new Date(props.photo.date * 1000));
});
</script>
<template>
  <div
    ref="photoDiv"
    class="a-not-dragable-and-not-select a-photo"
    tabindex="1"
    @click="onClick"
    v-on="swipes"
    @contextmenu.prevent.stop="onShowContextMenu"
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
    <div
      v-if="showInfo"
      class="a-not-dragable-and-not-select a-photo__info-top-left"
    >
      <div class="a-photo__info-date">
        {{ dateTime }}
      </div>
      <div class="a-photo__info-counter">
        <b>{{ photo.__state.index + 1 }}</b> из {{ count ?? "?" }}
      </div>
    </div>
  </div>
  <VDialog v-model="showMoreInfo">
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
                win.alert('JSON скопирован в буфер.');
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
  background-image: linear-gradient(
      to right top,
      rgba(209, 107, 165, 0.47),
      rgba(199, 119, 185, 0.51),
      rgba(186, 131, 202, 0.54),
      rgba(170, 143, 216, 0.51),
      rgba(154, 154, 225, 0.5),
      rgba(138, 167, 236, 0.5),
      rgba(121, 179, 244, 0.5),
      rgba(105, 191, 248, 0.5),
      rgba(82, 207, 254, 0.5),
      rgba(65, 223, 255, 0.5),
      rgba(70, 238, 250, 0.5),
      rgba(95, 251, 241, 0.5)
  );
  border-radius: 10px;
  color: #6effd2;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  height: max-content;
  margin-left: 15px;
  margin-top: 10px;
  padding: 3px;
  pointer-events: none;
  position: absolute;
  text-align: center;
  text-shadow: #000000 1px 0 10px;
  width: max-content;
  z-index: 2;
}

.a-photo__info-top-left {
  left: 0;
  top: 0;
}

.a-photo__info-top-right {
  right: 0;
  top: 0;
}

.a-photo__info-date {
  font-size: 0.8em;
}
</style>
