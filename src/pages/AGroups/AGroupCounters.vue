<script lang="ts" setup>
import { openLink } from "@/helpers/openLink";
import { useGroupCounters } from "@/pages/AGroups/useGroupCounters";
import { IGroup } from "@/store/groups/types";
import { toRef } from "vue";

const props = defineProps<{
  group: IGroup;
}>();
const groupRef = toRef(() => props.group);
const counters = useGroupCounters(groupRef);
</script>
<template>
  <div v-if="counters.length > 0" class="a-group-counters">
    <VChip
      v-for="counter in counters"
      :key="counter.name"
      :title="counter.name"
      @click="openLink(counter.link)"
    >
      <div class="a-group-counters__counter">
        <component :is="counter.icon" class="a-group-counters__icon" />
        <div class="a-group-counter__count">
          {{ counter.count }}
        </div>
      </div>
    </VChip>
  </div>
</template>
<style lang="scss">
.a-group-counters {
  display: flex;
  gap: 6px;
  padding: 8px var(--vkui--size_base_padding_horizontal--regular);
  flex-wrap: wrap;
}

.a-group-counters__icon {
  display: flex;
  justify-content: center;
  pointer-events: none; // отключаем title у svg
}

.a-group-counters__counter {
  align-content: flex-start;
  align-items: center;
  display: flex;
  flex-direction: row;
  font-family: var(--vkui--font_family_base);
  justify-content: flex-start;
  gap: 6px;
}

.a-group-counter__count {
  align-items: center;
  display: flex;
  justify-content: center;
  margin-left: auto;
  font-weight: 600;
}
</style>
