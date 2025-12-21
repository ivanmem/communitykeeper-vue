<script lang="ts" setup>
import PermissionGroups from "@/shared/widgets/PermissionGroups.vue";
import { useAppCaption } from "@/shared/composables/useAppCaption";
import AlbumPage from "@/pages/Album/AlbumPage.vue";
import { useI18n } from "vue-i18n";
import { computed } from "vue";

const { t } = useI18n({
  messages: {
    ru: { title: "Галерея: Альбом" },
    en: { title: "Gallery: Album" },
  },
});

useAppCaption(computed(() => t("title")));
</script>
<template>
  <PermissionGroups :component="AlbumPage" />
</template>
