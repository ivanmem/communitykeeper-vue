<script setup lang="ts">
import { useActivated } from "@/composables/useActivated";

const props = defineProps({
  to: { type: String },
  disabled: Boolean,
});

const isActivated = useActivated();
</script>
<template>
  <Teleport :disabled="!isActivated || props.disabled" :to="props.to">
    <slot />
  </Teleport>
</template>
