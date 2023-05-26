import { computed, ref } from "vue";
import GroupHelper from "../../helpers/GroupHelper";
import { useGroups } from "../../store/groups/groups";

export type UseGroupSearch = ReturnType<typeof useGroupSearch>;

export function useGroupSearch() {
  const store = useGroups();
  const groupsOrder = computed(() =>
    GroupHelper.getFiltered(store.groups, store.filters)
  );
  const showFilters = ref(false);
  return {
    store,
    groupsOrder,
    showFilters,
  };
}
