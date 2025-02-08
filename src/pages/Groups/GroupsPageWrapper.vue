<script lang="ts" setup>
import PermissionGroups from "@/shared/widgets/PermissionGroups.vue";
import { useAppCaption } from "@/shared/composables/useAppCaption";
import { useGroups } from "@/store/groups/groups";
import GroupsPage from "@/pages/Groups/GroupsPage.vue";

useAppCaption("Группы");
const groupsStore = useGroups();
</script>
<template>
  <PermissionGroups
    :component="GroupsPage"
    :force-show="!groupsStore.localGroupsMap.size"
  />
</template>
