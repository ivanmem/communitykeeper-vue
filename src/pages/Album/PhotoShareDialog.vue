<script lang="ts" setup>
import useClipboard from "vue-clipboard3";
import { IPhoto } from "@/store/groups/types";
import { computed, onActivated, onDeactivated, shallowRef } from "vue";
import { PhotoHelper } from "@/shared/helpers/PhotoHelper";
import { Icon24CopyOutline, Icon24Linked } from "vue-vkontakte-icons";

export interface PhotoShareDialogProps {
  photo: IPhoto;
}

const props = defineProps<PhotoShareDialogProps>();
const emits = defineEmits<{
  close: [];
}>();

const originalSize = computed(() =>
  PhotoHelper.getOriginalSize(props.photo.sizes),
);

const { toClipboard } = useClipboard({ appendToBody: true });

const IconCopyLink = shallowRef(Icon24Linked);
const IconCopyDirectLink = shallowRef(Icon24Linked);

onActivated(() => {
  IconCopyLink.value = Icon24Linked;
  IconCopyDirectLink.value = Icon24Linked;
});

onDeactivated(() => {
  emits("close");
});
</script>
<template>
  <VDialog
    :model-value="true"
    :persistent="false"
    close-on-back
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
      </div>
      <VCardActions>
        <VSpacer />
        <VBtn @click="emits('close')">Закрыть</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
