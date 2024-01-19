<script lang="ts" setup>
import useClipboard from "vue-clipboard3";
import { IPhoto } from "@/store/groups/types";
import { PhotoHelper } from "@/helpers/PhotoHelper";
import bridge from "@vkontakte/vk-bridge";
import { computed, onActivated, shallowRef } from "vue";
import Icon24CopyOutline from "@vkontakte/icons/src/svg/24/copy_outline_24.svg?component";
import Icon24Linked from "@vkontakte/icons/src/svg/24/linked_24.svg?component";
import { icons } from "@/common/consts";

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
    attachments: PhotoHelper.getPhotoKey(props.photo.owner_id, props.photo.id),
  });
};
const { toClipboard } = useClipboard({ appendToBody: true });

const IconCopyLink = shallowRef(Icon24Linked);
const IconCopyDirectLink = shallowRef(Icon24Linked);

onActivated(() => {
  IconCopyLink.value = Icon24Linked;
  IconCopyDirectLink.value = Icon24Linked;
});
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
      <div
        style="
          max-width: 450px;
          display: flex;
          flex-direction: column;
          margin: 10px;
          align-items: flex-start;
        "
      >
        <VBtn
          :prepend-icon="IconCopyLink"
          flat
          @click="
            toClipboard(
              PhotoHelper.getPhotoUrl(props.photo.owner_id, props.photo.id),
              $event.target,
            );
            IconCopyLink = Icon24CopyOutline;
          "
        >
          Ссылка
        </VBtn>
        <VBtn
          :prepend-icon="IconCopyDirectLink"
          flat
          @click="
            toClipboard(originalSize!.url, $event.target);
            IconCopyDirectLink = Icon24CopyOutline;
          "
        >
          Прямая ссылка
        </VBtn>
        <VBtn :prepend-icon="icons.Icon24Share" flat @click="onShareWall">
          Поделиться на стене
        </VBtn>
      </div>
      <VCardActions>
        <VSpacer />
        <VBtn @click="emits('close')">Закрыть</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
