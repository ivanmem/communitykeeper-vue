<script lang="ts" setup>
import { useVk } from "@/store/vk/vk";
import BaseButton from "@/components/BaseButton";
import { computed, onActivated, ref } from "vue";
import { useGroups } from "@/store/groups/groups";
import { useScreenSpinner } from "@/shared/composables/useScreenSpinner";
import { useActiveRoute } from "@/shared/composables/useActiveRoute";
import { Icon24KeyOutline } from "vue-vkontakte-icons";
import { useI18n } from "vue-i18n";

const { t } = useI18n({
  messages: {
    ru: {
      accessRequired:
        "Требуется доступ. Без него приложение не может корректно отображать информацию о группах!",
      allow: "Разрешить",
    },
    en: {
      accessRequired:
        "Access required. Without it, the app cannot correctly display group information!",
      allow: "Allow",
    },
  },
});

const props = defineProps<{ component: any; forceShow?: boolean }>();
const vkStore = useVk();
const groupsStore = useGroups();
const activeRoute = useActiveRoute();
const loading = ref(!vkStore.apiService && !props.forceShow);
useScreenSpinner(loading);

const onInit = async () => {
  if (vkStore.apiService) {
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
  () => !vkStore.apiService && !loading.value && !props.forceShow,
);
const isShowComponent = computed(
  () => props.forceShow || (!loading.value && vkStore.apiService),
);
</script>
<template>
  <div v-if="isShowBanner" class="a-permission-groups">
    <VBanner
      :icon="Icon24KeyOutline"
      class="a-permission-groups__banner"
      color="deep-purple-accent-4"
      lines="one"
    >
      <div>{{ t("accessRequired") }}</div>
      <div class="a-permission-groups__access-btn">
        <BaseButton @click="onInit()">{{ t("allow") }}</BaseButton>
      </div>
    </VBanner>
  </div>
  <template v-if="isShowComponent">
    <component :is="component" v-bind="activeRoute.params" />
  </template>
</template>
<style lang="scss">
.a-permission-groups__banner {
  padding-block: 8px;
}

.a-permission-groups__access-btn {
  display: flex;
  align-items: center;
  flex-grow: 1;
  justify-content: flex-end;
  margin-left: 5px;
}
</style>
