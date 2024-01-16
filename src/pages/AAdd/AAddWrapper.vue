<script lang="ts" setup>
import APermissionGroups from "@/components/APermissionGroups.vue";
import { useAppCaption } from "@/composables/useAppCaption";
import AAdd from "@/pages/AAdd/AAdd.vue";

useAppCaption("Добавление групп");
</script>
<template>
  <APermissionGroups :component="AAdd" />
</template>
