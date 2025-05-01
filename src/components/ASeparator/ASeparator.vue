<template>
  <div class="a-separator">
    <div class="a-separator__in"></div>
  </div>
</template>
<style lang="scss">
.a-separator {
  color: var(--vkui--color_separator_primary, #d7d8d9);

  &__in {
    background: currentColor;
    border: 0;
    color: inherit;
    height: var(--vkui--size_border--regular, 1px);
    margin: 0;
    transform-origin: center top;
  }
}
</style>
