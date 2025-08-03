<script lang="ts" setup>
import { IPhoto } from "@/store/groups/types";
import { onActivated, onDeactivated, shallowRef } from "vue";
import { Icon24Linked } from "vue-vkontakte-icons";
import { useGroups } from "@/store/groups/groups";
import {
  currentAlbumPhotoElSize,
  currentAverageLikes,
} from "@/pages/Album/useCurrentPhoto";

export interface PhotoSkipSettingsDialogProps {
  photo: IPhoto;
}

const props = defineProps<PhotoSkipSettingsDialogProps>();
const emits = defineEmits<{
  close: [];
}>();

const IconCopyLink = shallowRef(Icon24Linked);
const IconCopyDirectLink = shallowRef(Icon24Linked);

const groupsStore = useGroups();

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
        <VCardTitle>Настройки пропуска</VCardTitle>
      </VCardItem>
      <VCardText>
        <VSwitch
          v-model="groupsStore.config.skipLowResolutionPhotos"
          :messages="`Ширина от ${Math.ceil(currentAlbumPhotoElSize.width.value)}px, либо высота от ${Math.ceil(currentAlbumPhotoElSize.height.value)}px`"
          label="Низкое разрешение"
        />

        <VSwitch
          class="mt-2"
          v-model="groupsStore.config.skipLowLikesPhotos"
          :label="`Лайков меньше среднего`"
          :messages="`От ${currentAverageLikes}`"
        />
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn @click="emits('close')">Закрыть</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
