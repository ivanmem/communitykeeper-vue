<script lang="ts" setup>
import PermissionGroups from "@/shared/widgets/PermissionGroups.vue";
import { useAppCaption } from "@/shared/composables/useAppCaption";
import HistoryPage from "@/pages/History/HistoryPage.vue";
import { useHistory } from "@/store/history/history";

useAppCaption("История");
const historyStore = useHistory();
</script>
<template>
  <PermissionGroups :component="HistoryPage" :force-show="!historyStore.length" />
</template>
