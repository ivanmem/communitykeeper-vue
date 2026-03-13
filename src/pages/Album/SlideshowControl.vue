<script lang="ts" setup>
import { useGroups } from "@/store/groups/groups";
import { computed } from "vue";
import { useI18n } from "vue-i18n";

const { t } = useI18n();
const groupsStore = useGroups();

const slideshowInterval = computed({
  get: () => groupsStore.config.slideshowInterval ?? 5,
  set: (value: number) => {
    groupsStore.config.slideshowInterval = value;
  },
});
</script>
<template>
  <div class="slideshow-control" @click.stop>
    <VSlider
      v-model="slideshowInterval"
      :min="0.5"
      :max="10"
      :step="0.5"
      thumb-label
      hide-details
      density="compact"
    >
      <template #thumb-label="{ modelValue }">
        {{ modelValue }} {{ t("gallery.slideshowSeconds") }}
      </template>
    </VSlider>
  </div>
</template>
<style lang="scss">
.slideshow-control {
  left: env(safe-area-inset-left, 0);
  bottom: env(safe-area-inset-bottom, 0);
  margin-left: 25px;
  margin-bottom: 15px;
  pointer-events: auto;
  position: fixed;
  width: 100px;
  z-index: 3;

  .v-slider-thumb__label {
    div {
      white-space: nowrap;
    }
  }
}
</style>
