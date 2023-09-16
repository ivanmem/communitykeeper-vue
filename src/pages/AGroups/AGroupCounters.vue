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
  <VList
    v-if="counters.length > 0"
    class="a-group-counters"
    density="compact"
    mandatory
  >
    <VListItem
      v-for="counter in counters"
      :key="counter.name"
      width="100%"
      @click="openLink(counter.link)"
    >
      <template #prepend>
        <div class="a-group-counters__icon">
          <component :is="counter.icon" />
        </div>
      </template>
      <VSheet class="a-group-counters__counter">
        <div>
          {{ counter.name }}
        </div>
        <div class="a-group-counter__count">
          {{ counter.count }}
        </div>
      </VSheet>
    </VListItem>
  </VList>
</template>
<style lang="scss">
.a-group-counters {
  padding-top: 0;
}

.a-group-counters__icon {
  display: flex;
  width: 48px;
  margin-right: 12px;
  justify-content: center;
}

.a-group-counters__counter {
  display: flex;
  flex-direction: row;
  align-content: flex-start;
  align-items: center;
  justify-content: flex-start;
  font-family: var(--vkui--font_family_base);
}

.a-group-counter__count {
  margin-left: auto;
  border-radius: 12px;
  height: 24px;
  min-width: 24px;
  background: var(--counter_primary_background);
  color: var(--counter_primary_text);
  padding-left: 5px;
  padding-right: 5px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: var(--vkui--font_headline2--font_size--compact, 14px);
  line-height: var(--vkui--font_headline2--line_height--compact, 20px);
  font-weight: 400;
  margin-right: 6px;
}
</style>
