<script lang="ts" setup>
import APermissionGroups from "@/components/APermissionGroups.vue";
import { useAppCaption } from "@/shared/composables/useAppCaption";
import AlbumPage from "@/pages/Album/AlbumPage.vue";

useAppCaption("Галерея: Альбом");
</script>
<template>
  <APermissionGroups :component="AlbumPage" />
</template>
