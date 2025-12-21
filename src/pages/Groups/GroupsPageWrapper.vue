<script lang="ts" setup>
import PermissionGroups from "@/shared/widgets/PermissionGroups.vue";
import { useAppCaption } from "@/shared/composables/useAppCaption";
import { useGroups } from "@/store/groups/groups";
import GroupsPage from "@/pages/Groups/GroupsPage.vue";
import { useI18n } from "vue-i18n";
import { computed } from "vue";

const { t } = useI18n({
  messages: {
    ru: { title: "Группы" },
    en: { title: "Groups" },
  },
});

useAppCaption(computed(() => t("title")));
const groupsStore = useGroups();
</script>
<template>
  <PermissionGroups
    :component="GroupsPage"
    :force-show="!groupsStore.localGroupsMap.size"
  />
</template>
