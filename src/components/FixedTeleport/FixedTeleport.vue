<script lang="ts" setup>
import { useActivated } from "@/shared/composables/useActivated";
import { FixedTeleportProps } from "@/components/FixedTeleport/FixedTeleport";

const props = defineProps<FixedTeleportProps>();
const isActivated = useActivated();
</script>
<template>
  <Teleport :disabled="!isActivated || props.disabled" :to="props.to">
    <slot />
  </Teleport>
</template>
