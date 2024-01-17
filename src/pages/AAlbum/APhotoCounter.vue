<script lang="ts" setup>
import { useGroups } from "@/store/groups/groups";
import { computed } from "vue";

defineProps<{
  showInfo: boolean;
  dateTime: string;
  photoIndex: number;
  count: number | string | undefined;
}>();
const groupsStore = useGroups();
const opacity = computed(
  () => (groupsStore.config.opacityGalleryCounter ?? 100) / 100,
);
</script>
<template>
  <div v-show="showInfo" class="a-not-dragable-and-not-select a-photo-counter">
    <div class="a-photo__info-date">
      {{ dateTime }}
    </div>
    <div class="a-photo__info-counter">
      <b>{{ photoIndex + 1 }}</b> из {{ count ?? "?" }}
    </div>
  </div>
</template>
<style lang="scss">
.a-photo__info-date {
  font-size: 0.8em;
}

.a-photo-counter {
  background-image: linear-gradient(
    to right top,
    rgba(209, 107, 165, 0.47),
    rgba(199, 119, 185, 0.51),
    rgba(186, 131, 202, 0.54),
    rgba(170, 143, 216, 0.51),
    rgba(154, 154, 225, 0.5),
    rgba(138, 167, 236, 0.5),
    rgba(121, 179, 244, 0.5),
    rgba(105, 191, 248, 0.5),
    rgba(82, 207, 254, 0.5),
    rgba(65, 223, 255, 0.5),
    rgba(70, 238, 250, 0.5),
    rgba(95, 251, 241, 0.5)
  );
  border-radius: 10px;
  color: #6effd2;
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  height: max-content;
  opacity: v-bind(opacity);
  padding: 3px;
  text-align: center;
  text-shadow: #000000 1px 0 10px;
  width: max-content;
}
</style>
