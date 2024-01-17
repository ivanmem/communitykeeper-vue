<script lang="ts" setup>
import { icons } from "@/common/consts";
import { useVk } from "@/store/vk/vk";
import AButton from "@/components/AButton/AButton.vue";
import { computed, onActivated, onBeforeMount, ref } from "vue";
import { useGroups } from "@/store/groups/groups";
import { useScreenSpinner } from "@/composables/useScreenSpinner";
import { useActiveRoute } from "@/composables/useActiveRoute";

const props = defineProps<{ component: any; forceShow?: boolean }>();
const vkStore = useVk();
const groupsStore = useGroups();
const activeRoute = useActiveRoute();
const loading = ref(!vkStore.api && !props.forceShow);
useScreenSpinner(loading);

const onInit = async () => {
  if (vkStore.api) {
    return;
  }

  loading.value = true;
  try {
    (await vkStore.initVk()) && (await groupsStore.loadNotLoadGroups());
  } finally {
    loading.value = false;
  }
};

onActivated(() => {
  if (props.forceShow) {
    return;
  }

  return onInit();
});

const isShowBanner = computed(
  () => !vkStore.api && !loading.value && !props.forceShow,
);
const isShowComponent = computed(
  () => props.forceShow || (!loading.value && vkStore.api),
);
</script>
<template>
  <div v-if="isShowBanner">
    <VBanner
      :icon="icons.Icon24KeyOutline"
      color="deep-purple-accent-4"
      lines="one"
      style="padding-block: 8px"
    >
      <div>
        Требуется доступ. Без него приложение не может корректно отображать информацию о группах!
      </div>
      <div
        style="
          display: flex;
          align-items: center;
          flex-grow: 1;
          justify-content: flex-end;
          margin-left: 5px;
        "
      >
        <AButton @click="onInit()">Разрешить</AButton>
      </div>
    </VBanner>
  </div>
  <template v-if="isShowComponent">
    <component :is="component" v-bind="activeRoute.params" />
  </template>
</template>
