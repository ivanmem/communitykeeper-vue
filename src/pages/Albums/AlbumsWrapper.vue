<script lang="ts" setup>
import PermissionGroups from "@/shared/widgets/PermissionGroups.vue";
import { useAppCaption } from "@/shared/composables/useAppCaption";
import AlbumsPage from "@/pages/Albums/AlbumsPage.vue";

useAppCaption("Галерея: Альбомы");
</script>
<template>
  <PermissionGroups :component="AlbumsPage" />
</template>
