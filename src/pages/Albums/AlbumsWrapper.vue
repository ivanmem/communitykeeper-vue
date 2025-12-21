<script lang="ts" setup>
import PermissionGroups from "@/shared/widgets/PermissionGroups.vue";
import { useAppCaption } from "@/shared/composables/useAppCaption";
import AlbumsPage from "@/pages/Albums/AlbumsPage.vue";
import { useI18n } from "vue-i18n";
import { computed } from "vue";

const { t } = useI18n({
  messages: {
    ru: { title: "Галерея: Альбомы" },
    en: { title: "Gallery: Albums" },
  },
});

useAppCaption(computed(() => t("title")));
</script>
<template>
  <PermissionGroups :component="AlbumsPage" />
</template>
