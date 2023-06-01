<script lang="ts" setup>
import { IGroup, ILocalGroup } from "../../store/groups/types";
import AButton from "../../components/AButton/AButton.vue";
import { getGroupState } from "./getGroupState";
import { openLink } from "../../helpers/openLink";
import AGroupCounters from "./AGroupCounters.vue";

const props = defineProps<{
  group: IGroup;
  localGroup: ILocalGroup;
}>();
</script>

<template>
  <div class="a-button__root">
    <AButton
      class="a-group-link a-button__block"
      @click="openLink(`//vk.com/public${localGroup.id}`)"
    >
      <b>{{ group.name }}</b>
      <span class="a-group-link__help">
        {{ getGroupState(group).text.join(", ") }}
      </span>
    </AButton>
    <AGroupCounters :local-group="localGroup" :group="group" />
  </div>
</template>

<style lang="scss">
.a-button__root {
}

.a-group-link {
  display: flex;
  flex-direction: column;
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
