<script lang="ts" setup>
import APermissionGroups from "@/components/APermissionGroups.vue";
import { useAppCaption } from "@/composables/useAppCaption";
import AHistory from "@/pages/AHistory/AHistory.vue";
import { useHistory } from "@/store/history/history";

useAppCaption("История");
const historyStore = useHistory();
</script>
<template>
  <APermissionGroups :component="AHistory" :force-show="!historyStore.length" />
</template>
