<script lang="ts" setup>
import { computed, StyleValue, useSlots, VueElement } from "vue";
import { icons } from "@/common/consts";
import { RouteLocationRaw, useRoute, useRouter } from "vue-router";
import isString from "lodash-es/isString";

const props = defineProps<{
  icon?: VueElement | keyof typeof icons;
  iconStyle?: StyleValue;
  to?: RouteLocationRaw;
  target?: string | undefined;
  exactActiveDataType?: "accent";
  dataType?: "accent";
  hideContent?: boolean;
}>();

const emits = defineEmits<{
  click: [MouseEvent];
}>();

const isExternalLink = computed(
  () => typeof props.to === "string" && props.to.startsWith("http"),
);

const route = useRoute();
const router = useRouter();

const onClick = async (e: MouseEvent) => {
  emits("click", e);
  if (props.to !== undefined) {
    if (isString(props.to) && isExternalLink.value) {
      window.open(props.to, props.target);
    } else {
      await router.push(props.to);
    }
  }
};

const link = computed(() => {
  if (!props.to || isExternalLink.value) {
    return undefined;
  }

  return { isExactActive: route.path === props.to };
});

const dataType = computed(() => {
  if (link.value?.isExactActive && !isExternalLink.value) {
    return props.exactActiveDataType ?? "accent";
  }

  return props.dataType;
});

const slots = useSlots();

const hasContent = computed(() => {
  return !!slots.default && !props.hideContent;
});
</script>

<template>
  <button :data-type="dataType" class="a-button" @click="onClick">
    <template v-if="props.icon">
      <component
        :is="
          typeof props.icon === 'string'
            ? icons[props.icon] ?? props.icon
            : props.icon
        "
        :data-has-content="hasContent"
        :style="props.iconStyle"
        class="a-button__icon"
      />
    </template>
    <slot v-if="!hideContent" />
  </button>
</template>

<style lang="scss"></style>
