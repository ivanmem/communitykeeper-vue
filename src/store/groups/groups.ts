import { defineStore } from "pinia";
import { IGroup, IGroupCounters, IGroupsExport, ILocalGroup } from "./types";
import { keyBy, toNumber, uniq } from "lodash";
import { useVk } from "../vk/vk";
import { saveAs } from "file-saver";

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
      groups.forEach((group) => this.groupsMap.set(group.id, group));
      for (let group of this.groups) {
        await this.loadGroupCounters(group);
      }
    },
    getLocalGroupById(id: number): ILocalGroup | undefined {
      return this.localGroups[id];
    },
    getExport(): IGroupsExport {
      return { groupIdsDictByFolderName: this.groupIdsDictByFolderName };
    },
    downloadExport() {
      const exportJson = JSON.stringify(this.getExport());
      // Создаем новый Blob-объект (данные в двоичном виде)
      const blob = new Blob([exportJson], { type: "application/json" });
      // Сохраняем файл на компьютере пользователя
      saveAs(blob, "catalog-export.json");
    },
    saveImport(data: IGroupsExport) {
      Object.keys(data.groupIdsDictByFolderName).forEach((folder) => {
        data.groupIdsDictByFolderName[folder].forEach((id) => {
          this.addLocalGroup({
            id,
            folder,
          });
        });
      });
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
      this.localGroupsArray = this.localGroupsArray.filter((x) => x.id !== id);
    },
    removeLocalGroups() {
      this.localGroupsArray = [];
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
      return Array.from(this.groupsMap.values()).filter(
        (x) => this.localGroups[x.id]
      );
    },
    localGroups(): Record<number | string, ILocalGroup> {
      return keyBy(this.localGroupsArray, (x) => x.id);
    },
    groupIdsDictByFolderName(): Record<string, number[]> {
      return this.localGroupsArray.reduce((dict, value) => {
        dict[value.folder] ??= [];
        dict[value.folder].push(value.id);
        return dict;
      }, {} as Record<string, number[]>);
    },
  },
});
