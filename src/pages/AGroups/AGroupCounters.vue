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
        <div class="a-group-counter__count" style="min-width: 36px">
          <div class="a-group-counter__count-wrapper">
            {{ counter.count }}
          </div>
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
  justify-content: center;
  margin-right: 12px;
  width: 48px;
}

.a-group-counters__counter {
  align-content: flex-start;
  align-items: center;
  display: flex;
  flex-direction: row;
  font-family: var(--vkui--font_family_base);
  justify-content: flex-start;
}

.a-group-counter__count {
  align-items: center;
  display: flex;
  justify-content: center;
  margin-left: auto;
  min-height: 36px;
  min-width: 36px;
}

.a-group-counter__count-wrapper {
  align-items: center;
  background: var(--counter_primary_background);
  border-radius: 12px;
  color: var(--counter_primary_text);
  display: flex;
  font-size: var(--vkui--font_headline2--font_size--compact, 14px);
  font-weight: 400;
  height: 24px;
  justify-content: center;
  line-height: var(--vkui--font_headline2--line_height--compact, 20px);
  min-width: 24px;

  padding-left: 5px;
  padding-right: 5px;
  width: max-content;
}
</style>
