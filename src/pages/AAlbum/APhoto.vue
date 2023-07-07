<script lang="ts" setup>
import { IPhoto } from "vkontakte-api";
import { computed, h, ref, watch } from "vue";
import { PhotoHelper } from "@/helpers/PhotoHelper";
import { showContextMenu } from "@/helpers/showContextMenu";
import { openLink } from "@/helpers/openLink";
import { icons } from "@/common/consts";
import { saveAs } from "file-saver";
import { MenuItem } from "@imengyu/vue3-context-menu";
import { useGroups } from "@/store/groups/groups";
import bridge from "@vkontakte/vk-bridge";
import { useApp } from "@/store/app/app";

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

watch(
  [photoDiv, () => useApp().isFullScreen],
  () => {
    if (photoDiv.value) {
      photoDiv.value.focus();
    }
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
    label: useGroups().config.originalSizePhoto
      ? `Расширить на весь экран`
      : "Отображать в оригинальном размере",
    icon: h(
      useGroups().config.originalSizePhoto
        ? icons.Icon24Fullscreen
        : icons.Icon24FullscreenExit,
      { width: "16px", height: "16px" }
    ),
    onClick: () => {
      useGroups().config.originalSizePhoto =
        !useGroups().config.originalSizePhoto;
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
</script>
<template>
  <div
    ref="photoDiv"
    tabindex="1"
    class="a-photo"
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
      :style="{ flexGrow: useGroups().config.originalSizePhoto ? 0 : 1 }"
      v-if="originalSize"
      :src="originalSize.url"
    />
    <div v-if="showInfo && index !== undefined" class="a-photo__info">
      <div class="a-photo__info-counter">
        {{ index + 1 }} из {{ count ?? "?" }}
      </div>
    </div>
  </div>
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
    flex-grow: 1;
    user-select: none;
    pointer-events: none;
    max-width: 100%;
    max-height: 100%;
    object-fit: contain;
    width: auto;
    height: auto;
    display: flex;
    justify-content: center;
    align-content: center;

    @media (resolution: 1.25dppx) {
      zoom: 0.875;
    }
    @media (resolution: 1.5dppx) {
      zoom: 0.75;
    }
    @media (resolution: 1.75dppx) {
      zoom: 0.625;
    }
    @media (resolution: 2dppx) {
      zoom: 0.5;
    }
    @media (resolution: 2.25dppx) {
      zoom: 0.444444;
    }
    @media (resolution: 2.5dppx) {
      zoom: 0.4;
    }
    @media (resolution: 2.75dppx) {
      zoom: 0.363636;
    }
    @media (resolution: 3dppx) {
      zoom: 0.333333;
    }
    @media (resolution: 3.5dppx) {
      zoom: 0.285714;
    }
    @media (resolution: 4dppx) {
      zoom: 0.25;
    }
    @media (resolution: 4.5dppx) {
      zoom: 0.222222;
    }
    @media (resolution: 5dppx) {
      zoom: 0.2;
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
  pointer-events: none;
  user-select: none;
  border-radius: 10px;
  padding: 3px;
  color: white;
  z-index: 2;
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
