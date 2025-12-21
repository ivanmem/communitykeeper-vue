<script lang="ts" setup>
import { IGroup, IGroupMemberStatus } from "@/store/groups/types";
import BaseButton from "@/components/BaseButton";
import { openUrl } from "@/shared/helpers/openUrl";
import GroupCounters from "@/pages/Groups/GroupCounters.vue";
import { computed, h, ref, watch } from "vue";
import { useGroups } from "@/store/groups/groups";
import { useElementVisibility } from "@vueuse/core";
import { styledIcons } from "@/shared/constants/consts";
import { showContextMenu } from "@/shared/helpers/showContextMenu";
import GroupHelper from "@/shared/helpers/GroupHelper";
import { MenuItem } from "@imengyu/vue3-context-menu";
import useClipboard from "vue-clipboard3";
import { useRouter } from "vue-router";
import { AddPageQueryParams } from "@/pages/Add/types";
import { useDialog } from "@/store/dialog/dialog";
import { useActivated } from "@/shared/composables/useActivated";
import { useApp } from "@/store/app/app";
import {
  Icon16AddSquareOutline,
  Icon16ChainOutline,
  Icon16DeleteOutline,
  Icon16DoorEnterArrowRightOutline,
  Icon16MoreVertical,
  Icon16PictureOutline,
} from "vue-vkontakte-icons";
import { useI18n } from "vue-i18n";

const { t } = useI18n({
  messages: {
    ru: {
      copyLink: "Скопировать ссылку",
      copyLinkError: "Ошибка при копировании ссылки",
      builtInGallery: "Встроенная галерея",
      replace: "Заменить",
      cancelRequest: "Отменить заявку [не работает]",
      leave: "Выйти",
      leaveGroupTitle: "Выход из группы",
      leaveGroupConfirm: 'Вы выходите из закрытой группы "{name}".\nВас могут не принять обратно. Всё равно хотите выйти?',
      yes: "Да",
      submitRequest: "Подать заявку",
      subscribe: "Подписаться",
      delete: "Удалить",
    },
    en: {
      copyLink: "Copy link",
      copyLinkError: "Error copying link",
      builtInGallery: "Built-in gallery",
      replace: "Replace",
      cancelRequest: "Cancel request [not working]",
      leave: "Leave",
      leaveGroupTitle: "Leave group",
      leaveGroupConfirm: 'You are leaving a closed group "{name}".\nYou may not be accepted back. Do you still want to leave?',
      yes: "Yes",
      submitRequest: "Submit request",
      subscribe: "Subscribe",
      delete: "Delete",
    },
  },
});

const props = defineProps<{
  group: IGroup;
  applyFilters?: boolean;
}>();
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

const { toClipboard } = useClipboard({ appendToBody: true });

const onOpenContextMenu = (e: MouseEvent) => {
  const isGroupAdded = groupsStore.localGroupsMap.has(props.group.id);
  const items: MenuItem[] = [];
  items.push({
    label: t("copyLink"),
    icon: h(Icon16ChainOutline),
    onClick: async () => {
      try {
        await toClipboard(link.value);
      } catch (ex) {
        const title = t("copyLinkError");
        console.error(title, ex);
        dialogStore.alert({
          title,
          subtitle: link.value,
        });
      }
    },
  });

  items.push({
    label: t("builtInGallery"),
    icon: h(Icon16PictureOutline),
    onClick: async () => {
      return router.push(`/albums/-${props.group.id}`);
    },
  });

  if (isGroupAdded) {
    items.push({
      label: t("replace"),
      icon: h(styledIcons.Icon16FolderMoveOutline),
      onClick: () => {
        return router.push({
          name: "add",
          query: {
            groupId: props.group.id.toString(),
            folder: localGroup.value?.folder,
          } satisfies AddPageQueryParams,
        });
      },
    });
  }

  const requestSent =
    props.group.member_status === IGroupMemberStatus.JoiningRequestSent;
  if (props.group.is_member || requestSent) {
    items.push({
      label: requestSent ? t("cancelRequest") : t("leave"),
      icon: h(Icon16DoorEnterArrowRightOutline),
      onClick: async () => {
        let confirm = true;
        if (props.group.is_closed && !requestSent) {
          confirm = await dialogStore.confirm({
            title: t("leaveGroupTitle"),
            subtitle: t("leaveGroupConfirm", { name: GroupHelper.getName(props.group) }),
            confirmTitle: t("yes"),
          });
        }

        if (confirm) {
          return GroupHelper.setIsMember(props.group, false);
        }
      },
    });
  } else {
    if (
      !props.group.deactivated &&
      props.group.is_closed !== 2 &&
      (!props.group.is_closed || !appStore.isApp)
    ) {
      items.push({
        label: props.group.is_closed ? t("submitRequest") : t("subscribe"),
        icon: h(Icon16AddSquareOutline),
        onClick: async () => {
          return GroupHelper.setIsMember(props.group, true);
        },
      });
    }
  }

  if (isGroupAdded) {
    items.push({
      label: t("delete"),
      icon: h(Icon16DeleteOutline, { style: { color: "red" } }),
      onClick: async () => {
        groupsStore.removeLocalGroup(props.group.id);
        await groupsStore.autoSaveCurrentLocalGroups();
      },
    });
  }

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
    <BaseButton
      class="a-group-link a-button__block"
      @click="openUrl(`//` + link)"
    >
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
      <BaseButton
        class="a-group-link__context-menu"
        :icon="Icon16MoreVertical"
        @click.stop="onOpenContextMenu"
      />
    </BaseButton>
    <GroupCounters v-if="showCounters" :group="group" />
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
