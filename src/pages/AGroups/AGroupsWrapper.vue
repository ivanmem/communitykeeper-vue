<script lang="ts" setup>
import APermissionGroups from "@/components/APermissionGroups.vue";
import { useAppCaption } from "@/composables/useAppCaption";
import { useGroups } from "@/store/groups/groups";
import AGroups from "@/pages/AGroups/AGroups.vue";

useAppCaption("Группы");
const groupsStore = useGroups();
</script>
<template>
  <APermissionGroups
    :component="AGroups"
    :force-show="!groupsStore.localGroupsArray.length"
  />
</template>
