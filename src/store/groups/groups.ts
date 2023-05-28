import { defineStore } from "pinia";
import { IGroup, IGroupCounters, ILocalGroup } from "./types";
import { keyBy, toNumber, uniq } from "lodash";
import { useVk } from "../vk/vk";

export interface FiltersType {
  folder: string | undefined;
  search: string;
}

interface GroupsState {
  localGroupsArray: ILocalGroup[];
  groupsMap: Map<number, IGroup>;
  filters: FiltersType;
  isInit: boolean;
}

export const useGroups = defineStore("groups", {
  state: (): GroupsState => {
    return {
      localGroupsArray: [],
      groupsMap: new Map(),
      filters: { folder: undefined, search: "" },
      isInit: false,
    };
  },
  actions: {
    async init() {
      await this.updateCurrentLocalGroups();
      await this.loadNotLoadGroups();
      this.isInit = true;
    },
    async updateCurrentLocalGroups() {
      this.localGroupsArray.length = 0;
      const dictLocalGroups = await this.getCurrentLocalGroups();
      Object.keys(dictLocalGroups).forEach((folder) => {
        const groupsIds = dictLocalGroups[folder];
        groupsIds.forEach((id) => {
          this.localGroupsArray.push({
            id,
            folder,
          });
        });
      });
    },
    async loadNotLoadGroups() {
      const ids = Object.keys(this.localGroups)
        .map(toNumber)
        .filter((id) => !this.groupsMap.has(id));
      const api = useVk().api;
      if (ids.length === 0 || !api) {
        return;
      }

      const groups = await api.addRequestToQueue<any, IGroup[]>({
        method: "groups.getById",
        params: {
          group_ids: ids.join(),
          fields: "counters",
        },
      });
      console.log({ groups });
      groups.forEach((group) => this.groupsMap.set(group.id, group));
      for (let group of this.groups) {
        await this.loadGroupCounters(group);
      }
    },
    getLocalGroupById(id: number): ILocalGroup {
      return this.localGroups[id];
    },
    getGroupById(id: number): IGroup {
      return this.groupsMap.get(id)!;
    },
    addLocalGroup(localGroup: ILocalGroup) {
      // если группа уже существует - перезаписываем
      if (this.localGroupsArray.some((x) => x.id === localGroup.id)) {
        this.localGroupsArray = this.localGroupsArray.filter(
          (x) => x.id !== localGroup.id
        );
      }

      this.localGroupsArray.push(localGroup);
    },
    removeLocalGroup(id: number) {
      this.localGroupsArray = this.localGroupsArray.filter(x => x.id !== id);
    },
    async loadGroupCounters(group: IGroup) {
      group.counters = await useVk().api!.addRequestToQueue<
        any,
        IGroupCounters
      >({
        method: "execute.counters",
        params: {
          group_id: group.id,
        },
      });
      return group;
    },
    async saveCurrentLocalGroups() {
      const allData = this.localGroupsArray.reduce((data, localGroup) => {
        data[localGroup.folder] ??= [];
        data[localGroup.folder].push(localGroup.id);
        return data;
      }, {} as Record<string, number[]>);
      const stringifyStr = JSON.stringify(allData);
      await useVk().setVkStorage("groups", stringifyStr);
    },
    async getCurrentLocalGroups(): Promise<Record<string, number[]>> {
      const value = await useVk().getVkStorage("groups");
      if (!value) {
        return {};
      }

      return JSON.parse(value);
    },
  },
  getters: {
    folders(): string[] {
      return uniq(this.localGroupsArray.map((x) => x.folder));
    },
    groups(): IGroup[] {
      return Array.from(this.groupsMap.values());
    },
    localGroups(): Record<number | string, ILocalGroup> {
      return keyBy(this.localGroupsArray, (x) => x.id);
    },
  },
});
