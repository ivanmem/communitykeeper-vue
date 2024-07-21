<script lang="ts" setup>
import PermissionGroups from "@/shared/widgets/PermissionGroups.vue";
import { useAppCaption } from "@/shared/composables/useAppCaption";
import AddPage from "@/pages/Add/AddPage.vue";

useAppCaption("Добавление групп");
</script>
<template>
  <PermissionGroups :component="AddPage" />
</template>
