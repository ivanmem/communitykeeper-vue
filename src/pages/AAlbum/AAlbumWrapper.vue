<script lang="ts" setup>
import APermissionGroups from "@/components/APermissionGroups.vue";
import { useAppCaption } from "@/composables/useAppCaption";
import AAlbum from "@/pages/AAlbum/AAlbum.vue";

useAppCaption("Галерея: Альбом");
</script>
<template>
  <APermissionGroups :component="AAlbum" />
</template>
