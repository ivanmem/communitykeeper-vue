<script lang="ts" setup>
import { computed } from "vue";
import { VList } from "virtua/vue";
import type { GridArray } from "@/shared/types/grid";
import type { IAlbumItem } from "@/shared/types/album";
import AlbumsPreview from "@/pages/Albums/AlbumsPreview.vue";

const props = defineProps<{
  albums: GridArray<IAlbumItem>;
  sizes: {
    height: number;
    width: number;
  };
  componentRef: InstanceType<typeof VList> | undefined;
}>();

const emit = defineEmits<{
  "update:scroll": [];
  "update:componentRef": [componentRef: InstanceType<typeof VList> | undefined];
}>();

const componentRef = computed({
  get: () => props.componentRef,
  set: (v) => emit("update:componentRef", v),
});
</script>

<template>
  <VList
    ref="componentRef"
    #default="{ item: indexes, index }"
    :data="albums.indexes"
    :item-size="sizes.height"
    class="a-albums-list"
    @scroll="emit('scroll')"
  >
    <div
      :key="albums.items[indexes?.[0]]?.id ?? index"
      class="a-albums-list__row"
    >
      <AlbumsPreview
        v-for="index in indexes"
        :key="albums.items[index].id"
        :album="albums.items[index]"
        :sizes="sizes"
      />
    </div>
  </VList>
</template>

<style lang="scss">
.a-albums-list {
  flex-basis: 0;
  flex-grow: 1;
  padding-block: 10px;

  &__row {
    display: flex;
  }
}
</style>
