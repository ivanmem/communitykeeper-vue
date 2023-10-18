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
      <VCardItem>
        <VCardTitle>Отправка фотографии</VCardTitle>
      </VCardItem>
      <VCardItem style="max-width: 450px">
        <VBtn
          :prepend-icon="styledIcons.Icon24CopyOutline"
          @click="
            toClipboard(
              PhotoHelper.getPhotoUrl(props.photo.owner_id, props.photo.id),
              $event.target,
            )
          "
        >
          Скопировать ссылку
        </VBtn>
        <VBtn
          :prepend-icon="styledIcons.Icon24CopyOutline"
          @click="toClipboard(originalSize!.url, $event.target)"
        >
          Скопировать прямую ссылку
        </VBtn>
        <VBtn :prepend-icon="icons.Icon24Share" @click="onShareWall">
          Поделиться прямой ссылкой на стене
        </VBtn>
      </VCardItem>
      <VCardActions>
        <VSpacer />
        <VBtn @click="emits('close')">Закрыть</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
