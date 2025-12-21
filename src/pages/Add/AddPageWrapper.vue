<script lang="ts" setup>
import PermissionGroups from "@/shared/widgets/PermissionGroups.vue";
import { useAppCaption } from "@/shared/composables/useAppCaption";
import AddPage from "@/pages/Add/AddPage.vue";
import { useI18n } from "vue-i18n";
import { computed } from "vue";

const { t } = useI18n({
  messages: {
    ru: { title: "Добавление групп" },
    en: { title: "Add Groups" },
  },
});

useAppCaption(computed(() => t("title")));
</script>
<template>
  <PermissionGroups :component="AddPage" />
</template>
