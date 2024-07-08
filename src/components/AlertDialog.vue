<script lang="ts" setup>
import { onBeforeRouteUpdate } from "vue-router";

export interface AlertDialogProps {
  title?: string;
  subtitle?: string;
  subtitleStyle?: string;
  mode?: "alert" | "confirm";
  confirmTitle?: string;
  cancelTitle?: string;
  persistent?: boolean;
}

const props = withDefaults(defineProps<AlertDialogProps>(), {
  subtitleStyle: "max-width: 450px;",
});
const emits = defineEmits<{
  close: [];
  confirm: [];
}>();

onBeforeRouteUpdate((to, from, next) => {
  if (!props.persistent) {
    emits("close");
  }

  next();
});
</script>
<template>
  <VDialog
    :close-on-back="true"
    :model-value="true"
    :persistent="props.persistent ?? false"
    class="a-alert-dialog"
    max-width="max-content"
    @update:model-value="!$event && emits('close')"
  >
    <VCard>
      <VCardItem>
        <VCardTitle class="a-alert-dialog__title">{{ props.title }}</VCardTitle>
      </VCardItem>
      <VCardText :style="props.subtitleStyle" class="a-alert-dialog__subtitle">
        {{ props.subtitle }}
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn v-if="mode === 'confirm'" @click="emits('close')">
          {{ props.cancelTitle ?? "Отмена" }}
        </VBtn>
        <VBtn
          @click="
            mode === 'confirm' && emits('confirm');
            emits('close');
          "
        >
          {{ props.confirmTitle ?? "Ок" }}
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
<style lang="scss">
.a-alert-dialog__title,
.a-alert-dialog__subtitle {
  white-space: pre-wrap;
}
</style>
