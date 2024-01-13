<script lang="ts" setup>
import { nextTick, ref, watch } from "vue";
import { useElementSize, useWindowSize } from "@vueuse/core";

const div = ref<HTMLDivElement | undefined>();
const size = useElementSize(div);
const initFontSize = ref<number>(-1);
const windowSize = useWindowSize();

watch(
  [size.width, windowSize.width],
  async ([width, windowWidth], [prevWidth, prevWindowWidth]) => {
    if (!div.value) {
      return;
    }

    try {
      if (
        prevWidth &&
        prevWindowWidth &&
        (width > prevWidth || windowWidth > prevWindowWidth)
      ) {
        div.value.style.removeProperty("font-size");
        await nextTick();
      }

      let fontSize = parseFloat(
        getComputedStyle(div.value).getPropertyValue("font-size"),
      );
      if (initFontSize.value === -1) {
        initFontSize.value = fontSize;
      }

      while (div.value.scrollWidth > div.value.clientWidth && fontSize > 1) {
        fontSize -= 1;
        div.value.style.fontSize = fontSize + "px";
      }
    } catch (ex) {
      console.warn("ASingleLineDynamicFont error:", ex);
    }
  },
);
</script>
<template>
  <div ref="div" class="a-single-line-dynamic-font">
    <slot />
  </div>
</template>
<style lang="scss">
.a-single-line-dynamic-font {
  overflow: hidden;
  white-space: nowrap;
  word-break: normal;
}
</style>
