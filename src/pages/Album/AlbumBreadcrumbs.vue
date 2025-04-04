<script lang="ts" setup>
import { computed } from "vue";
import { router } from "@/router";
import GroupHelper from "@/shared/helpers/GroupHelper";
import { openUrl } from "@/shared/helpers/openUrl";
import { PhotoHelper } from "@/shared/helpers/PhotoHelper";
import type { IGroup } from "@/store/groups/types";
import { Icon16ChevronOutline } from "vue-vkontakte-icons";

const props = withDefaults(
  defineProps<{
    ownerId: number | string;
    albumId: number | string;
    group: IGroup;
    albumTitle?: string;
  }>(),
  {
    albumTitle: "Альбом",
  },
);

const albumUrl = computed(() =>
  PhotoHelper.getAlbumUrl(props.ownerId, props.albumId),
);

const ownerUrl = computed(() => PhotoHelper.getOwnerUrl(props.ownerId));

function backToAlbums() {
  router.replace(`/albums/${props.ownerId}`);
}

function openUrlAlbum() {
  openUrl(`//${albumUrl.value}`);
}
</script>
<template>
  <VBreadcrumbs class="a-album-breadcrumbs" density="compact">
    <VBreadcrumbsItem to="/"> Группы</VBreadcrumbsItem>
    <Icon16ChevronOutline />
    <VBreadcrumbsItem
      :href="`https://${ownerUrl}`"
      :title="GroupHelper.getName(group)"
      @click.prevent="backToAlbums"
    />
    <Icon16ChevronOutline />
    <VBreadcrumbsItem
      :href="`https://${albumUrl}`"
      :title="albumTitle"
      @click.prevent="openUrlAlbum"
    />
  </VBreadcrumbs>
</template>
<style lang="scss">
.v-breadcrumbs.a-album-breadcrumbs {
  padding-left: 12px;
  padding-right: 16px;
}
</style>
