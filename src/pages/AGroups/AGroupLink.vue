<script lang="ts" setup>
import { IGroup } from "@/store/groups/types";
import AButton from "@/components/AButton/AButton.vue";
import { getGroupState } from "@/pages/AGroups/getGroupState";
import { openLink } from "@/helpers/openLink";
import AGroupCounters from "@/pages/AGroups/AGroupCounters.vue";
import { h, onDeactivated, ref, watch } from "vue";
import { useGroups } from "@/store/groups/groups";
import { useElementVisibility } from "@vueuse/core";
import { sleep } from "@/helpers/sleep";
import { icons } from "@/common/consts";
import { showContextMenu } from "@/helpers/showContextMenu";

const props = defineProps<{
  group: IGroup;
  index: number;
}>();
const target = ref<HTMLDivElement | null>(null);
const targetIsVisible = useElementVisibility(target);
const isDeactivated = ref(false);
let isLoaded = ref(false);

watch(
  targetIsVisible,
  async () => {
    if (!targetIsVisible.value || isLoaded.value) {
      return;
    }

    isLoaded.value = true;
    // таким образом загрузка будет по порядку
    await sleep(props.index * 2);

    if (isDeactivated.value) {
      return;
    }

    if (!targetIsVisible.value) {
      isLoaded.value = false;
      return;
    }

    await useGroups().loadGroupCounters(props.group);
  },
  { immediate: true }
);

onDeactivated(() => {
  isDeactivated.value = true;
});

const onOpenContextMenu = (e: MouseEvent) => {
  showContextMenu(e, [
    {
      label: "Удалить",
      icon: h(icons.Icon16DeleteOutline),
      onClick: () => {
        useGroups().removeLocalGroup(props.group.id);
        useGroups().autoSaveCurrentLocalGroups();
      },
    },
  ]);
};
</script>

<template>
  <div
    ref="target"
    class="a-button__root"
    @click.right.prevent.stop="onOpenContextMenu"
  >
    <AButton
      class="a-group-link a-button__block"
      @click="openLink(`//vk.com/public${group.id}`)"
    >
      <div class="a-group-link__div">
        <b>{{ group.name }}</b>
        <span class="a-group-link__help">
          {{ getGroupState(group).text.join(", ") }}
        </span>
      </div>

      <AButton
        icon="Icon16MoreVertical"
        class="a-group-link__context-menu"
        @click.stop="onOpenContextMenu"
      ></AButton>
    </AButton>
    <AGroupCounters :group="group" />
  </div>
</template>

<style lang="scss">
.a-button__root {
}

.a-group-link {
  display: flex;
  text-decoration: none;
  padding: 8px var(--vkui--size_base_padding_horizontal--regular);
  font-family: var(--vkui--font_family_base);
  color: var(--vkui--color_text_primary);
  background: none;
  border: none;
  justify-content: flex-start;
  align-items: flex-start;
  text-align: left;
  align-content: flex-start;
}

.a-group-link__div {
  display: flex;
  flex-direction: column;
}

.a-group-link__context-menu {
  display: flex;
  margin-left: auto;
  justify-content: center;
  align-items: center;
  border-radius: 50%;
  width: 26px;

  .a-button__icon {
    margin: 0;
  }
}

.a-group-link__help {
  font-size: var(--vkui--font_subhead--font_size--compact, 13px);
  flex-grow: 1;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  line-height: var(--vkui--font_subhead--line_height--compact, 16px);
  font-weight: var(--vkui--font_subhead--font_weight--regular, 400);
  font-family: var(--vkui--font_title1--font_family--regular);
}
</style>
