<script lang="ts" setup>
import APermissionGroups from "@/components/APermissionGroups.vue";
import { useAppCaption } from "@/shared/composables/useAppCaption";
import { useGroups } from "@/store/groups/groups";
import GroupsPage from "@/pages/Groups/GroupsPage.vue";

useAppCaption("Группы");
const groupsStore = useGroups();
</script>
<template>
  <APermissionGroups
    :component="GroupsPage"
    :force-show="!groupsStore.localGroupsArray.length"
  />
</template>
