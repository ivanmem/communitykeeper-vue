<script lang="ts" setup>
import { computed } from "vue";

const props = withDefaults(
  defineProps<{
    absolute?: boolean;
  }>(),
  {
    absolute: true,
  },
);

const position = computed(() => (props.absolute ? "absolute" : "static"));
</script>
<template>
  <div class="a-spinner" />
</template>
<style lang="scss" scoped>
.a-spinner {
  bottom: 0;
  left: 0;
  position: v-bind(position);
  right: 0;
  top: 0;
  z-index: 10000;

  &:before {
    animation-duration: 700ms;
    animation-iteration-count: infinite;
    animation-name: round_spinner;
    animation-timing-function: linear;
    background-image: url(data:image/svg+xml;charset=utf-8,%3Csvg%20fill%3D%22none%22%20height%3D%2216%22%20viewBox%3D%220%200%2016%2016%22%20width%3D%2216%22%20xmlns%3D%22http%3A%2F%2Fwww.w3.org%2F2000%2Fsvg%22%3E%0A%20%20%3Cpath%20clip-rule%3D%22evenodd%22%20d%3D%22M11.21%202.93a6%206%200%200%200-8.64%207.62%201%201%200%201%201-1.8.86A8%208%200%201%201%208%2016a1%201%200%201%201%200-2%206%206%200%200%200%203.21-11.07z%22%20fill%3D%22%23939393%22%20fill-rule%3D%22evenodd%22%2F%3E%0A%3C%2Fsvg%3E%0A);
    background-position: center;
    background-repeat: no-repeat;
    background-size: 16px;
    content: "";
    display: block;
    height: 16px;
    left: 50%;
    margin: -8px 0 0-8px;
    position: v-bind(position);
    top: 50%;
    width: 16px;
  }
}
</style>
