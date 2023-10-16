<script lang="ts" setup>
import { useDialog } from "@/store/dialog/dialog";

const dialogStore = useDialog();
</script>
<template>
  <component
    :is="window.options.component"
    v-for="window of dialogStore.windows.values()"
    :id="window.key"
    :key="window.key"
    v-bind="window.options.props"
  />
</template>
