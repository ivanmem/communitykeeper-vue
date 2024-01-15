<script lang="ts" setup>
import { icons } from "@/common/consts";
import { useVk } from "@/store/vk/vk";
import AButton from "@/components/AButton/AButton.vue";
import { useRoute } from "vue-router";
import { onActivated, ref } from "vue";
import { useGroups } from "@/store/groups/groups";
import { useScreenSpinner } from "@/composables/useScreenSpinner";

const props = defineProps<{ component: any; forceShow?: boolean }>();
const vkStore = useVk();
const groupsStore = useGroups();
const route = useRoute();

const loading = ref(false);
useScreenSpinner(loading);

const onInit = async () => {
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
</script>
<template>
  <div v-if="!vkStore.api && !loading && !forceShow">
    <VBanner
      :icon="icons.Icon24KeyOutline"
      color="deep-purple-accent-4"
      lines="one"
      style="padding-block: 8px"
    >
      <VBannerText>Требуется доступ</VBannerText>
      <div
        style="
          display: flex;
          align-items: center;
          flex-grow: 1;
          justify-content: flex-end;
        "
      >
        <AButton @click="onInit()">Разрешить</AButton>
      </div>
    </VBanner>
  </div>
  <component
    :is="component"
    v-else-if="forceShow || !loading"
    v-bind="route.params"
  />
</template>
