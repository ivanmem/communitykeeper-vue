<script lang="ts" setup>
import APermissionGroups from "@/components/APermissionGroups.vue";
import { useAppCaption } from "@/composables/useAppCaption";
import AAlbums from "@/pages/AAlbums/AAlbums.vue";

useAppCaption("Галерея: Альбомы");
</script>
<template>
  <APermissionGroups :component="AAlbums" />
</template>
