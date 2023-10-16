<script lang="ts" setup>
import { icons, styledIcons } from "@/common/consts";
import useClipboard from "vue-clipboard3";
import { IPhoto } from "@/store/groups/types";
import { PhotoHelper } from "@/helpers/PhotoHelper";
import bridge from "@vkontakte/vk-bridge";
import { computed } from "vue";

export interface APhotoShareDialogProps {
  photo: IPhoto;
}

const props = defineProps<APhotoShareDialogProps>();
const emits = defineEmits<{
  close: [];
}>();

const originalSize = computed(() =>
  PhotoHelper.getOriginalSize(props.photo.sizes),
);

const onShareWall = () => {
  bridge.send("VKWebAppShowWallPostBox", {
    message: "",
    attachments: originalSize.value?.url,
  });
};
const { toClipboard } = useClipboard({ appendToBody: true });
</script>
<template>
  <VDialog
    :model-value="true"
    :persistent="false"
    max-width="max-content"
    @update:model-value="!$event && emits('close')"
  >
    <VCard>
      <VCardTitle>Отправка фотографии</VCardTitle>
      <VCol cols="auto">
        <VBtn
          :prepend-icon="styledIcons.Icon24CopyOutline"
          style="width: 100%"
          variant="tonal"
          @click="
            toClipboard(
              PhotoHelper.getPhotoUrl(props.photo.owner_id, props.photo.id),
              $event.target,
            )
          "
        >
          Скопировать ссылку
        </VBtn>
      </VCol>
      <VCol cols="auto">
        <VBtn
          :prepend-icon="styledIcons.Icon24CopyOutline"
          style="width: 100%"
          variant="tonal"
          @click="toClipboard(originalSize!.url, $event.target)"
        >
          Скопировать прямую ссылку
        </VBtn>
      </VCol>

      <VCol cols="auto">
        <VBtn
          :prepend-icon="icons.Icon24Share"
          style="width: 100%"
          variant="tonal"
          @click="onShareWall"
        >
          Поделиться прямой ссылкой на стене
        </VBtn>
      </VCol>
    </VCard>
  </VDialog>
</template>
