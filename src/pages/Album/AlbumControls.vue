<script lang="ts" setup>
import { icons, styledIcons } from "@/shared/constants/consts";
import { useGroups } from "@/store/groups/groups";

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
    <code v-if="screenError" class="vkuiFormField--status-error">
      {{ screenError }}
    </code>
    <VSpacer />
    <VSwitch
      v-if="!screenError && (isLoadingPhotos || !albumIsEmpty)"
      v-model="groupsStore.config.reverseOrder"
      :false-icon="styledIcons.Icon24SortOutlineOpacity50"
      :true-icon="icons.Icon24SortOutline"
      class="a-album-controls__reverse-order"
      hide-details
      label="В обратном порядке"
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
