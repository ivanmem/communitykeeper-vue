import { computed, ref } from "vue";
import { useGroups } from "@/store/groups/groups";
import GroupHelper from "@/helpers/GroupHelper";

export type UseGroupSearch = ReturnType<typeof useGroupSearch>;

export function useGroupSearch() {
  const store = useGroups();
  const groupsOrder = computed(() =>
    GroupHelper.getFiltered(store.groupsReverse, store.filters)
  );
  const showFilters = ref(false);
  return {
    store,
    groupsOrder,
    showFilters,
  };
}
