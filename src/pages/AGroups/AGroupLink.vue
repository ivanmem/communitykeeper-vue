<script lang="ts" setup>
import { IGroup } from "@/store/groups/types";
import AButton from "@/components/AButton/AButton.vue";
import { openLink } from "@/helpers/openLink";
import AGroupCounters from "@/pages/AGroups/AGroupCounters.vue";
import { computed, h, onDeactivated, ref, watch } from "vue";
import { useGroups } from "@/store/groups/groups";
import { useElementVisibility } from "@vueuse/core";
import { sleep } from "@/helpers/sleep";
import { icons } from "@/common/consts";
import { showContextMenu } from "@/helpers/showContextMenu";
import GroupHelper from "../../helpers/GroupHelper";
import { MenuItem } from "@imengyu/vue3-context-menu";
import useClipboard from "vue-clipboard3/dist/esm/index";
import { router } from "@/router";

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
    if (
      !targetIsVisible.value ||
      isLoaded.value ||
      !useGroups().config.showCounters
    ) {
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

const link = computed(() => `vk.com/public${props.group.id}`);

const { toClipboard } = useClipboard();

const onOpenContextMenu = (e: MouseEvent) => {
  const items: MenuItem[] = [];
  items.push({
    label: "Скопировать ссылку",
    icon: h(icons.Icon16ChainOutline),
    onClick: async () => {
      try {
        await toClipboard(link.value);
      } catch (ex) {
        console.error("Ошибка при копировании ссылки.", ex);
        window.alert(link.value);
      }
    },
  });
  items.push({
    label: "Галерея (в разработке)",
    icon: h(icons.Icon16FolderOutline),
    onClick: async () => {
      return router.push(`/albums/-${props.group.id}`);
    },
  });
  items.push({
    label: "Удалить",
    icon: h(icons.Icon16DeleteOutline),
    onClick: () => {
      useGroups().removeLocalGroup(props.group.id);
      useGroups().autoSaveCurrentLocalGroups();
    },
  });
  if (props.group.is_member) {
    items.push({
      label: "Выйти",
      icon: h(icons.Icon16DoorEnterArrowRightOutline),
      onClick: () => {
        return GroupHelper.setIsMember(props.group, false);
      },
    });
  } else {
    items.push({
      label: "Вступить",
      icon: h(icons.Icon16AddSquareOutline),
      onClick: async () => {
        return GroupHelper.setIsMember(props.group, true);
      },
    });
  }

  showContextMenu(e, items);
};
</script>

<template>
  <div
    ref="target"
    class="a-button__root"
    :data-link="link"
    @click.right.prevent.stop="onOpenContextMenu"
  >
    <AButton
      class="a-group-link a-button__block"
      @click="openLink(`//` + link)"
    >
      <div class="a-group-link__div">
        <b>{{ group.name }}</b>
        <span class="a-group-link__help">
          {{ GroupHelper.getState(group).text }}
        </span>
      </div>

      <AButton
        icon="Icon16MoreVertical"
        class="a-group-link__context-menu"
        @click.stop="onOpenContextMenu"
      ></AButton>
    </AButton>
    <AGroupCounters v-if="useGroups().config.showCounters" :group="group" />
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
  align-items: center;
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
  width: 36px;
  height: 36px;
  min-width: 36px;
  min-height: 36px;

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
  opacity: 0.7;
}
</style>
