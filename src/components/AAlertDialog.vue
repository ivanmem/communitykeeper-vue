<script lang="ts" setup>
export interface AAlertDialogProps {
  title?: string;
  subtitle?: string;
  subtitleStyle?: string;
  mode?: "alert" | "confirm";
}

const props = withDefaults(defineProps<AAlertDialogProps>(), {
  subtitleStyle: "max-width: 450px;",
});
const emits = defineEmits<{
  close: [];
  confirm: [];
}>();
</script>
<template>
  <VDialog
    :model-value="true"
    :persistent="false"
    max-width="max-content"
    @update:model-value="!$event && emits('close')"
  >
    <VCard>
      <VCardItem>
        <VCardTitle>{{ props.title }}</VCardTitle>
      </VCardItem>
      <VCardText :style="props.subtitleStyle">
        {{ props.subtitle }}
      </VCardText>
      <VCardActions>
        <VSpacer />
        <VBtn v-if="mode === 'confirm'" @click="emits('close')">Отмена</VBtn>
        <VBtn
          @click="
            mode === 'confirm' && emits('confirm');
            emits('close');
          "
        >
          Ок
        </VBtn>
      </VCardActions>
    </VCard>
  </VDialog>
</template>
