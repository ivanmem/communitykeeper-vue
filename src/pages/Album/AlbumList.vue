<script lang="ts" setup>
import { computed } from "vue";
import { VList } from "virtua/vue";
import { IPhoto } from "@/store/groups/types";
import AlbumPreview from "@/pages/Album/AlbumPreview.vue";

const props = defineProps<{
  photos: {
    items: IPhoto[];
    indexes: number[][];
  };
  sizes: {
    height: number;
    width: number;
  };
  componentRef: any;
}>();

const emit = defineEmits<{
  "update:componentRef": [componentRef: any];
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
    :key="`${photos.items[photos.indexes[0]?.[0]]?.id}`"
    ref="componentRef"
    #default="{ item: indexes, index }"
    :data="photos.indexes"
    :item-size="sizes.height"
    class="a-album-list"
    @scroll="$emit('update:scroll')"
  >
    <div :key="photos.items[indexes?.[0]]?.id ?? index" class="a-album-row">
      <AlbumPreview
        v-for="index in indexes"
        :key="photos.items[index].id"
        :index="index"
        :photo="photos.items[index]"
        :sizes="sizes"
        @click="$emit('select:photo', index)"
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
