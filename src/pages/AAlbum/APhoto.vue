<script lang="ts" setup>
import { computed, h, nextTick, ref, watch } from "vue";
import { PhotoHelper } from "@/helpers/PhotoHelper";
import { showContextMenu } from "@/helpers/showContextMenu";
import { openLink } from "@/helpers/openLink";
import { icons } from "@/common/consts";
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
  index?: number;
  count?: number | string;
}>();

const originalSize = computed(() =>
  PhotoHelper.getOriginalSize(props.photo.sizes)
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
  { immediate: true }
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
  { immediate: true }
);

const onShowContextMenu = (e: MouseEvent) => {
  const items: MenuItem[] = [];

  items.push({
    label: "Открыть в ВК",
    icon: h(icons.Icon16Link),
    onClick: () => {
      openLink(
        `//${PhotoHelper.getPhotoUrl(props.photo.owner_id, props.photo.id)}`
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
          PhotoHelper.getPhotoFileName(props.photo)
        );
      }
    },
  });
  items.push({
    label: "Найти оригинал",
    icon: h(icons.Icon16SearchStarsOutline),
    onClick: () => {
      openLink(
        `https://saucenao.com/search.php?url=${escape(originalSize.value!.url)}`
      );
    },
  });

  items.push({
    label: groupsStore.config.originalSizePhoto
      ? `Расширить на весь экран`
      : "Отображать в оригинальном размере",
    icon: h(
      groupsStore.config.originalSizePhoto
        ? icons.Icon24Fullscreen
        : icons.Icon24FullscreenExit,
      { width: "16px", height: "16px" }
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
</script>
<template>
  <div
    ref="photoDiv"
    class="a-not-dragable-and-not-select a-photo"
    tabindex="1"
    v-on="swipes"
    @click="onClick"
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
      v-if="showInfo && index !== undefined"
      class="a-not-dragable-and-not-select a-photo__info"
    >
      <div class="a-not-dragable-and-not-select a-photo__info-counter">
        {{ index + 1 }} из {{ count ?? "?" }}
      </div>
    </div>
  </div>
  <VDialog v-model="showMoreInfo">
    <VCard>
      <VCardTitle>Расширенная информация</VCardTitle>
      <VCardText>
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
  z-index: 1;
  position: fixed;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  display: flex;
  justify-content: center;
  align-items: center;
  vertical-align: top;
  margin: 2px 3px 3px 2px;
  background-color: black;
  cursor: pointer;

  img {
    display: flex;
    justify-content: center;
    align-content: center;
    flex-grow: 1;
    object-fit: contain;
    width: auto;
    height: auto;
    max-width: 100%;
    max-height: 100%;
    pointer-events: none;

    &[data-original-size-photo="true"] {
      zoom: calc(1 / var(--device-pixel-ratio));
      flex-grow: 0;
    }
  }
}

.a-photo__info {
  position: absolute;
  top: 0;
  bottom: 0;
  left: 0;
  right: 0;
  flex-grow: 1;
  display: flex;
  flex-direction: column;
  border-radius: 10px;
  padding: 3px;
  color: white;
  z-index: 2;
  pointer-events: none;
}

.a-photo__info-counter {
  display: flex;
  flex-direction: column;
  width: max-content;
  height: max-content;
  margin-top: 10px;
  margin-left: 15px;
  background-color: rgba(0, 0, 0, 0.3);
}
</style>
