<template>
  <template v-for="photo in photos" :key="photo">
    <link :href="photo" as="image" rel="preload" />
  </template>
</template>

<script lang="ts" setup>
import { defineProps } from "vue";
import { ImagePreloaderProps } from "@/components/ImagePreloader/ImagePreloader";

defineProps<ImagePreloaderProps>();
</script>
