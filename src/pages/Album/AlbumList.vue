<script lang="ts" setup>
import { computed, Ref } from "vue";
import { VList } from "virtua/vue";
import { IPhoto } from "@/store/groups/types";
import AlbumPreview from "@/pages/Album/AlbumPreview.vue";

const props = defineProps<{
  photos: {
    items: IPhoto[];
    indexes: Ref<number[][]>;
  };
  sizes: {
    height: number;
    width: number;
  };
  componentRef: InstanceType<typeof VList> | undefined;
}>();

const emit = defineEmits<{
  "update:componentRef": [componentRef: InstanceType<typeof VList> | undefined];
  "update:scroll": [];
  "select:photo": [index: number];
}>();

const componentRef = computed({
  get: () => props.componentRef,
  set: (v) => emit("update:componentRef", v),
});
</script>

<template>
  <VList
    :key="`${photos.items[photos.indexes.value[0]?.[0]]?.id}`"
    ref="componentRef"
    #default="{ item: rowIndexes, index }"
    :data="photos.indexes.value"
    :item-size="sizes.height"
    class="a-album-list"
    @scroll="$emit('update:scroll')"
  >
    <div :key="photos.items[rowIndexes?.[0]]?.id ?? index" class="a-album-row">
      <AlbumPreview
        v-for="idx in rowIndexes"
        :key="photos.items[idx].id"
        :index="idx"
        :photo="photos.items[idx]"
        :sizes="sizes"
        @click="$emit('select:photo', idx)"
      />
    </div>
  </VList>
</template>

<style lang="scss">
.a-album-list {
  flex-grow: 1;
}

.a-album-row {
  display: flex;
}
</style>
