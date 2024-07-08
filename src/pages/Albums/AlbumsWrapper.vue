<script lang="ts" setup>
import APermissionGroups from "@/components/APermissionGroups.vue";
import { useAppCaption } from "@/shared/composables/useAppCaption";
import AlbumsPage from "@/pages/Albums/AlbumsPage.vue";

useAppCaption("Галерея: Альбомы");
</script>
<template>
  <APermissionGroups :component="AlbumsPage" />
</template>
