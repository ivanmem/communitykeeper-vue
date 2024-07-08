import { computed, ref, watch } from "vue";
import { useGroups } from "@/store/groups/groups";
import GroupHelper from "@/shared/helpers/GroupHelper";
import { useSwipes } from "@/shared/composables/useSwipes";
import { useActivated } from "@/shared/composables/useActivated";

export type UseGroupSearch = ReturnType<typeof useGroupSearch>;

export function useGroupSearch() {
  const groupsStore = useGroups();
  const groupsOrder = computed(() =>
    GroupHelper.getFiltered(groupsStore.groupsIdsReverse, groupsStore.filters),
  );
  const showFilters = ref(false);
  const swipes = useSwipes({
    onLeft: groupsStore.switchFiltersFolderToPrev,
    onRight: groupsStore.switchFiltersFolderToNext,
  });
  const isActivated = useActivated();

  watch(
    isActivated,
    () => {
      if (isActivated.value) {
        groupsStore.loadNotLoadGroups().then();
      }
    },
    { immediate: true },
  );

  return {
    groupsOrder,
    showFilters,
    swipes,
  };
}
