<script lang="ts" setup>
import { computed } from "vue";
import { openUrl } from "@/shared/helpers/openUrl";
import { PhotoHelper } from "@/shared/helpers/PhotoHelper";
import { Icon16ChevronOutline } from "vue-vkontakte-icons";

const props = defineProps<{
  ownerId: number | string;
  groupName?: string;
}>();

const ownerUrl = computed(() => PhotoHelper.getOwnerUrl(props.ownerId));
</script>
<template>
  <VBreadcrumbs class="a-albums-breadcrumbs" density="compact">
    <VBreadcrumbsItem replace title="Группы" :to="{ name: 'groups' }" />
    <Icon16ChevronOutline />
    <VBreadcrumbsItem
      :href="`https://${ownerUrl}`"
      :title="groupName || 'Источник'"
      @click.prevent="openUrl(`//${ownerUrl}`)"
    />
  </VBreadcrumbs>
</template>
<style lang="scss">
.v-breadcrumbs.a-albums-breadcrumbs {
  padding-left: 12px;
  padding-right: 16px;
}
</style>
