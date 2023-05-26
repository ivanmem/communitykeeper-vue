<template>
  <div class="a-page-container vkuiGroup__inner Group__inner">
    <slot />
  </div>
</template>
<style lang="scss">
.a-page-container {
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  overflow: auto;
  gap: 5px;
  background: var(--vkui--color_background_content);
  color: var(--vkui--color_text_primary);
  padding: 8px var(--vkui--size_base_padding_horizontal--regular);
}
</style>
