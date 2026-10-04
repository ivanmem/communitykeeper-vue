<template>
  <template v-for="photo in photos" :key="photo">
    <link :href="photo" as="image" rel="preload" :fetchpriority="fetchPriority" />
  </template>
</template>

<script lang="ts" setup>
import { ImagePreloaderProps } from "@/components/ImagePreloader/ImagePreloader";

defineProps<ImagePreloaderProps>();
</script>
