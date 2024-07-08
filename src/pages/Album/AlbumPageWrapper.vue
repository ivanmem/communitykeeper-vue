<script lang="ts" setup>
import PermissionGroups from "@/components/PermissionGroups.vue";
import { useAppCaption } from "@/shared/composables/useAppCaption";
import AlbumPage from "@/pages/Album/AlbumPage.vue";

useAppCaption("Галерея: Альбом");
</script>
<template>
  <PermissionGroups :component="AlbumPage" />
</template>
