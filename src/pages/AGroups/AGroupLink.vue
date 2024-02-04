<script lang="ts" setup>
import { IGroup, IGroupMemberStatus } from "@/store/groups/types";
import AButton from "@/components/AButton/AButton.vue";
import { openUrl } from "@/helpers/openUrl";
import AGroupCounters from "@/pages/AGroups/AGroupCounters.vue";
import { computed, h, ref, watch } from "vue";
import { useGroups } from "@/store/groups/groups";
import { useElementVisibility } from "@vueuse/core";
import { sleep } from "@/helpers/sleep";
import { icons, styledIcons } from "@/common/consts";
import { showContextMenu } from "@/helpers/showContextMenu";
import GroupHelper from "../../helpers/GroupHelper";
import { MenuItem } from "@imengyu/vue3-context-menu";
import useClipboard from "vue-clipboard3/dist/esm/index";
import { useRouter } from "vue-router";
import { AAddQueryParams } from "@/pages/AAdd/types";
import { useDialog } from "@/store/dialog/dialog";
import { useActivated } from "@/composables/useActivated";
import { useApp } from "@/store/app/app";

const props = withDefaults(
  defineProps<{
    group: IGroup;
    index?: number;
    applyFilters?: boolean;
  }>(),
  { index: 0 },
);
const router = useRouter();
const groupsStore = useGroups();
const appStore = useApp();
const dialogStore = useDialog();
const groupState = computed(() => GroupHelper.getState(props.group));
const localGroup = computed(() =>
  groupsStore.getLocalGroupById(props.group.id),
);
const target = ref<HTMLDivElement | null>(null);
const targetIsVisible = useElementVisibility(target);
const isActivated = useActivated();
const isCurrentFolder = computed(
  () =>
    props.applyFilters &&
    localGroup.value?.folder === groupsStore.filters.folder,
);

watch(
  [targetIsVisible, isActivated],
  async () => {
    if (!groupsStore.config.showCounters) {
      return;
    }

    if (props.group.counters) {
      return;
    }

    if (groupState.value.needLoadingCounters) {
      return;
    }

    if (!targetIsVisible.value) {
      return;
    }

    // таким образом загрузка будет по порядку
    await sleep(props.index * 2);
    if (!isActivated.value) {
      return;
    }

    if (!targetIsVisible.value) {
      return;
    }

    groupState.value.needLoadingCounters = true;
  },
  { immediate: true },
);

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
        const title = "Ошибка при копировании ссылки";
        console.error(title, ex);
        dialogStore.alert({
          title,
          subtitle: link.value,
        });
      }
    },
  });
  items.push({
    label: "Встроенная галерея",
    icon: h(icons.Icon16PictureOutline),
    onClick: async () => {
      return router.push(`/albums/-${props.group.id}`);
    },
  });
  items.push({
    label: "Заменить",
    icon: h(styledIcons.Icon16FolderMoveOutline),
    onClick: () => {
      return router.push({
        name: "add",
        query: {
          groupId: props.group.id.toString(),
          folder: localGroup.value?.folder,
        } satisfies AAddQueryParams,
      });
    },
  });
  if (props.group.is_member) {
    items.push({
      label: "Выйти",
      icon: h(icons.Icon16DoorEnterArrowRightOutline),
      onClick: async () => {
        let confirm = true;
        if (props.group.is_closed) {
          confirm = await dialogStore.confirm({
            title: "Выход из группы",
            subtitle: `Вы выходите из закрытой группы "${GroupHelper.getName(
              props.group,
            )}".
Вас могут не принять обратно. Всё равно хотите выйти?`,
            confirmTitle: "Да",
          });
        }

        if (confirm) {
          return GroupHelper.setIsMember(props.group, false);
        }
      },
    });
  } else if (
    props.group.member_status !== IGroupMemberStatus.JoiningRequestSent
  ) {
    // отображаем кнопку только если группа открытая или если это не приложение,
    // так как присоединиться к закрытой группе можно только с vk.com или m.vk.com из-за бага в VK Bridge или Приложении ВКонтакте
    if (
      !props.group.deactivated &&
      props.group.is_closed !== 2 &&
      (!props.group.is_closed || !appStore.isApp)
    ) {
      items.push({
        label: props.group.is_closed ? `Подать заявку` : "Подписаться",
        icon: h(icons.Icon16AddSquareOutline),
        onClick: async () => {
          return GroupHelper.setIsMember(props.group, true);
        },
      });
    }
  }

  items.push({
    label: "Удалить",
    icon: h(icons.Icon16DeleteOutline, { style: { color: "red" } }),
    onClick: async () => {
      groupsStore.removeLocalGroup(props.group.id);
      await groupsStore.autoSaveCurrentLocalGroups();
    },
  });

  showContextMenu(e, items);
};

const onClickAvatar = async () => {
  if (
    groupState.value.hideCounters === undefined &&
    !groupsStore.config.showCounters
  ) {
    groupState.value.hideCounters = false;
    return;
  }

  if (!groupState.value.hideCounters) {
    groupState.value.hideCounters = true;
    return;
  }

  groupState.value.hideCounters = false;
  return;
};

const showCounters = computed(() => {
  return !(groupState.value.hideCounters ?? !groupsStore.config.showCounters);
});

watch(showCounters, () => {
  if (!showCounters.value) {
    return;
  }

  groupState.value.needLoadingCounters = true;
});
</script>

<template>
  <div
    ref="target"
    :data-link="link"
    class="a-button__root"
    @click.right.prevent.stop="onOpenContextMenu"
  >
    <AButton class="a-group-link a-button__block" @click="openUrl(`//` + link)">
      <img
        :src="group.photo_200"
        alt=""
        class="a-group-link__avatar"
        @click.stop="onClickAvatar"
      />
      <div class="a-group-link__div">
        <span class="a-group-link__name">{{ GroupHelper.getName(group) }}</span>
        <span class="a-group-link__help">
          <template v-if="!isCurrentFolder && localGroup">
            {{ localGroup.folder }};
          </template>
          {{ groupState.text }}
        </span>
      </div>
      <AButton
        class="a-group-link__context-menu"
        icon="Icon16MoreVertical"
        @click.stop="onOpenContextMenu"
      />
    </AButton>
    <AGroupCounters v-if="showCounters" :group="group" />
  </div>
</template>

<style lang="scss">
.a-button__root {
  user-select: none;
}

.a-group-link {
  align-content: flex-start;
  align-items: center;
  background: none;
  border: none;
  border-radius: 0;
  color: var(--vkui--color_text_primary);
  display: flex;
  font-family: var(--vkui--font_family_base);
  gap: 12px;
  justify-content: flex-start;
  padding: 8px var(--vkui--size_base_padding_horizontal--regular);
  text-align: left;
  text-decoration: none;
  transition: background-color 0.15s ease-out;

  &:hover {
    background-color: var(--a-group-link-hover-background);
    opacity: 1;
  }
}

.a-group-link__div {
  display: flex;
  flex-direction: column;
  overflow: hidden;
}

.a-group-link__context-menu {
  align-items: center;
  border-radius: 50%;
  display: flex;
  height: 36px;
  justify-content: center;
  margin-left: auto;
  min-height: 36px;
  min-width: 36px;
  width: 36px;

  .a-button__icon {
    margin: 0;
  }
}

.a-group-link__name {
  color: inherit;
  display: block;
  font-size: 15px;
  line-height: 20px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.a-group-link__help {
  font-family: var(--vkui--font_title1--font_family--regular);
  font-size: 12px;
  font-weight: var(--vkui--font_subhead--font_weight--regular, 400);
  line-height: var(--vkui--font_subhead--line_height--compact, 16px);
  opacity: 0.7;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: pre-line;
}

.a-group-link__avatar {
  border-radius: 50%;
  height: 48px;
  transform: rotate(0deg);
  transition: transform 0.5s ease;
  width: 48px;

  &:hover {
    transform: rotate(10deg);
  }
}
</style>
