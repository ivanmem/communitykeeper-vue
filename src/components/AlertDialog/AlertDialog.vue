<script lang="ts" setup>
import { onBeforeRouteUpdate } from "vue-router";
import { AlertDialogProps } from "@/components/AlertDialog/AlertDialog";
import { computed } from "vue";

const props = withDefaults(defineProps<AlertDialogProps>(), {
  subtitleStyle: "max-width: 450px;",
});
const emits = defineEmits<{
  close: [];
  confirm: [value: any];
}>();

const confirmButtons = computed(() =>
  Array.isArray(props.confirmTitle)
    ? props.confirmTitle
    : [
        {
          id: true,
          label: props.confirmTitle ?? "Ок",
        },
      ],
);

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
          v-for="x of confirmButtons"
          :key="`${x.id}`"
          @click="
            mode === 'confirm' && emits('confirm', x.id);
            emits('close');
          "
        >
          {{ x.label }}
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
