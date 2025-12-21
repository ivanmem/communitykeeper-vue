<script lang="ts" setup>
import { styledIcons } from "@/shared/constants/consts";
import { useGroups } from "@/store/groups/groups";
import { Icon24SortOutline } from "vue-vkontakte-icons";
import AError from "@/components/AError";
import { useI18n } from "vue-i18n";

const { t } = useI18n({
  messages: {
    ru: {
      reverseOrder: "В обратном порядке",
    },
    en: {
      reverseOrder: "Reverse order",
    },
  },
});

const props = defineProps<{
  positionLabel?: string;
  screenError?: string;
  isLoadingPhotos: boolean;
  albumIsEmpty: boolean;
}>();

const groupsStore = useGroups();
</script>

<template>
  <div class="a-album-controls">
    <div v-if="positionLabel" class="a-album-controls__position">
      {{ positionLabel }}
    </div>
    <AError v-if="screenError">{{ screenError }}</AError>
    <VSpacer />
    <VSwitch
      v-if="!screenError && (isLoadingPhotos || !albumIsEmpty)"
      v-model="groupsStore.config.reverseOrder"
      :false-icon="styledIcons.Icon24SortOutlineOpacity50"
      :true-icon="Icon24SortOutline"
      class="a-album-controls__reverse-order"
      hide-details
      :label="t('reverseOrder')"
      style="flex-grow: 0"
    />
  </div>
</template>

<style lang="scss">
.a-album-controls {
  display: flex;
  gap: 5px;
  align-items: center;
  flex-wrap: wrap;
  padding-inline: 16px;

  &__position {
    font-size: 12px;
  }

  &__reverse-order {
    .v-label {
      font-size: 12px;
    }
  }
}
</style>
