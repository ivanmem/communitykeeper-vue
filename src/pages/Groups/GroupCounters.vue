<script lang="ts" setup>
import {
  IGroupCounter,
  useGroupCounters,
} from "@/pages/Groups/useGroupCounters";
import { IGroup } from "@/store/groups/types";
import { ref, toRef, watch } from "vue";
import BaseSpinner from "@/components/BaseSpinner";
import GroupHelper from "@/shared/helpers/GroupHelper";
import { useGroups } from "@/store/groups/groups";
import { useHistory } from "@/store/history/history";
import { useSmartOpenUrl } from "@/shared/composables/useSmartOpenLink";

const props = defineProps<{
  group: IGroup;
}>();
const groupsStore = useGroups();
const historyStore = useHistory();
const groupRef = toRef(() => props.group);
const counters = useGroupCounters(groupRef);
const groupState = toRef(() => GroupHelper.getState(props.group));
const loading = ref(false);
const smartOpenUrl = useSmartOpenUrl();

watch(
  () => groupState.value.needLoadingCounters,
  async () => {
    if (!groupState.value.needLoadingCounters) {
      return;
    }

    loading.value = true;
    try {
      await groupsStore.loadGroupCounters(props.group);
    } finally {
      loading.value = false;
    }
  },
  { immediate: true },
);

const onClick = (counter: IGroupCounter) => {
  historyStore.add({
    type: "vc",
    url: counter.url,
    counter: counter.key,
    ownerId: -props.group.id,
  });

  smartOpenUrl(counter.url);
};
</script>
<template>
  <div class="a-group-counters">
    <VChip
      v-for="counter in counters"
      :key="counter.name"
      :title="counter.name"
      @click="onClick(counter)"
    >
      <div class="a-group-counters__counter">
        <component :is="counter.icon" class="a-group-counters__icon" />
        <div
          v-if="loading || counter.label.length"
          class="a-group-counter__count"
        >
          <BaseSpinner v-if="loading" :absolute="false" />
          <template v-else> {{ counter.label }}</template>
        </div>
      </div>
    </VChip>
  </div>
</template>
<style lang="scss">
.a-group-counters {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
  padding: 8px var(--vkui--size_base_padding_horizontal--regular);
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
  gap: 6px;
  justify-content: flex-start;
}

.a-group-counter__count {
  align-items: center;
  display: flex;
  font-weight: 600;
  justify-content: center;
  margin-left: auto;
}
</style>
