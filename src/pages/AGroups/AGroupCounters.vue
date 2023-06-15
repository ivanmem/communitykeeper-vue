<script lang="ts" setup>
import { openLink } from "../../helpers/openLink";
import AButton from "../../components/AButton/AButton.vue";
import { useGroupCounters } from "./useGroupCounters";
import { IGroup } from "../../store/groups/types";
import { toRef } from "vue";

const props = defineProps<{
  group: IGroup;
}>();
const groupRef = toRef(() => props.group);
const counters = useGroupCounters(groupRef);
</script>
<template>
  <div class="a-group-counters" v-if="counters.length > 0">
    <AButton
      class="a-group-counters__counter"
      :key="counter.name"
      v-for="counter in counters"
      :icon="counter.icon"
      @click="openLink(counter.link)"
    >
      <div>
        {{ counter.name }}
      </div>
      <div class="a-group-counter__count">
        {{ counter.count }}
      </div>
    </AButton>
  </div>
</template>
<style lang="scss">
.a-group-counters {
  background-color: var(--vkui--color_background_secondary);
}

.a-group-counters__counter {
  display: flex;
  flex-direction: row;
  align-content: flex-start;
  align-items: center;
  justify-content: flex-start;
  width: 100%;
  padding: 8px var(--vkui--size_base_padding_horizontal--regular);
  text-decoration: none;
  font-family: var(--vkui--font_family_base);
  color: var(--vkui--color_text_primary);
  background: none;
  border: none;
  text-align: left;
}

.a-group-counter__count {
  margin-left: auto;
  border-radius: 12px;
  height: 24px;
  min-width: 24px;
  background: var(--counter_primary_background);
  color: var(--counter_primary_text);
  padding: 3px;
  display: flex;
  justify-content: center;
  align-items: center;
  font-size: var(--vkui--font_headline2--font_size--compact, 14px);
  line-height: var(--vkui--font_headline2--line_height--compact, 20px);
}
</style>
