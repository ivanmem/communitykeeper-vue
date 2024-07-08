<script lang="ts" setup>
import APermissionGroups from "@/components/APermissionGroups.vue";
import { useAppCaption } from "@/shared/composables/useAppCaption";
import AddPage from "@/pages/Add/AddPage.vue";

useAppCaption("Добавление групп");
</script>
<template>
  <APermissionGroups :component="AddPage" />
</template>
