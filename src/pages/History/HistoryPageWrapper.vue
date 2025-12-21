<script lang="ts" setup>
import PermissionGroups from "@/shared/widgets/PermissionGroups.vue";
import { useAppCaption } from "@/shared/composables/useAppCaption";
import HistoryPage from "@/pages/History/HistoryPage.vue";
import { useHistory } from "@/store/history/history";
import { useI18n } from "vue-i18n";
import { computed } from "vue";

const { t } = useI18n({
  messages: {
    ru: { title: "История" },
    en: { title: "History" },
  },
});

useAppCaption(computed(() => t("title")));
const historyStore = useHistory();
</script>
<template>
  <PermissionGroups :component="HistoryPage" :force-show="!historyStore.length" />
</template>
