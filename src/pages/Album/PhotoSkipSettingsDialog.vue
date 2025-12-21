<script lang="ts" setup>
import { IPhoto } from "@/store/groups/types";
import { onActivated, onDeactivated, shallowRef } from "vue";
import { Icon24Linked } from "vue-vkontakte-icons";
import { useGroups } from "@/store/groups/groups";
import {
  currentAlbumPhotoElSize,
  currentAverageLikes,
} from "@/pages/Album/useCurrentPhoto";
import { useI18n } from "vue-i18n";

const { t } = useI18n({
  messages: {
    ru: {
      skipSettings: "Настройки пропуска",
      lowResolution: "Низкое разрешение",
      lowResolutionHint: "Ширина от {width}px, либо высота от {height}px",
      lowLikes: "Лайков меньше среднего",
      lowLikesHint: "От {count}",
      close: "Закрыть",
    },
    en: {
      skipSettings: "Skip settings",
      lowResolution: "Low resolution",
      lowResolutionHint: "Width from {width}px or height from {height}px",
      lowLikes: "Likes below average",
      lowLikesHint: "From {count}",
      close: "Close",
    },
  },
});

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
        <VCardTitle>{{ t("skipSettings") }}</VCardTitle>
      </VCardItem>
      <VCardText>
        <VSwitch
          v-model="groupsStore.config.skipLowResolutionPhotos"
          :messages="t('lowResolutionHint', { width: Math.ceil(currentAlbumPhotoElSize.width.value), height: Math.ceil(currentAlbumPhotoElSize.height.value) })"
          :label="t('lowResolution')"
        />

        <VSwitch
          class="mt-2"
          v-model="groupsStore.config.skipLowLikesPhotos"
          :label="t('lowLikes')"
          :messages="t('lowLikesHint', { count: currentAverageLikes })"
        />
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn @click="emits('close')">{{ t("close") }}</VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
