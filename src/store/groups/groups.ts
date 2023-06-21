import { defineStore } from "pinia";
import { IGroup, IGroupsExport, ILocalGroup } from "@/store/groups/types";
import { keyBy, toNumber, uniq } from "lodash";
import { useVk } from "@/store/vk/vk";
import { saveAs } from "file-saver";
import { isGroupBanned } from "@/helpers/isGroupBanned";
import { getGroupsByLinksOrIds } from "@/helpers/getGroupsByIds";
import { useApp } from "@/store/app/app";
import { watch } from "vue";
import GroupHelper from "@/helpers/GroupHelper";
import { setEruda } from "@/helpers/setEruda";

export interface FiltersType {
  folder: string;
  search: string;
  access: OnlyAccessEnum;
}

export enum OnlyAccessEnum {
  none,
  access,
  noAccess,
}

interface GroupsState {
  localGroupsArray: ILocalGroup[];
  groupsMap: Map<number, IGroup>;
  filters: FiltersType;
  isInit: boolean;
  config: IGroupsConfig;
  spaceUsed: number;
}

export interface IGroupsConfig {
  autoSave: boolean;
  showCounters: boolean;
  eruda?: boolean;
}

export const useGroups = defineStore("groups", {
  state: (): GroupsState => {
    return {
      localGroupsArray: [],
      groupsMap: new Map(),
      filters: { folder: "", search: "", access: OnlyAccessEnum.none },
      isInit: false,
      config: { autoSave: true, showCounters: true },
      spaceUsed: 0,
    };
  },
  actions: {
    async init() {
      try {
        await this.updateConfig();
        await this.updateCurrentLocalGroups();
        await this.loadNotLoadGroups();
      } catch (ex: any) {
        console.error("init groups", ex);
      }

      this.isInit = true;
      watch(
        this.config,
        useApp().wrapLoading(() => {
          return this.saveCurrentConfig();
        }),
        { deep: true }
      );
      watch(
        () => this.config.eruda,
        useApp().wrapLoading(() => {
          return setEruda(Boolean(this.config.eruda));
        }),
        { immediate: this.config.eruda }
      );
      console.info("groups store init");
    },
    async updateCurrentLocalGroups() {
      this.localGroupsArray.length = 0;
      const dictLocalGroups = await this.getCurrentLocalGroups();
      console.info({ dictLocalGroups });
      Object.keys(dictLocalGroups).forEach((folder) => {
        const groupsIds = dictLocalGroups[folder];
        if (!Array.isArray(groupsIds)) {
          console.warn(`folder "${folder}" not array groupsIds`, { groupsIds });
          return;
        }

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

      const groups = await getGroupsByLinksOrIds(ids);
      groups.forEach((group) => {
        this.setGroup(group);
      });
    },
    setGroup(group: IGroup) {
      GroupHelper.getState(group);
      this.groupsMap.set(group.id, group);
      return group;
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
    getGroupById(id: number | string): IGroup {
      return this.groupsMap.get(+id)!;
    },
    async getGroupByIdOrLoad(id: number | string): Promise<IGroup> {
      const group = this.getGroupById(id);
      if (group) return group;

      const groups = await getGroupsByLinksOrIds([id]);
      return groups[0];
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
      if (group.counters || isGroupBanned(group)) {
        return group;
      }

      const loadingFinisher = useApp().getLoadingFinisher();
      try {
        const [{ counters }] = await useVk().addRequestToQueue<any, IGroup[]>({
          method: "groups.getById",
          params: {
            group_id: group.id,
            fields: "counters",
          },
        });
        group.counters = counters;
        return group;
      } finally {
        loadingFinisher();
      }
    },
    async saveCurrentConfig() {
      await useVk().setVkStorageDict({
        config: this.config,
      });
    },
    async updateConfig() {
      try {
        const { config } = await useVk().getVkStorageDict<IGroupsConfig>([
          "config",
        ]);
        // таким нехитрым образом мы убедимся в правильности формата сохранённого конфига
        if (
          config &&
          config.autoSave !== undefined &&
          config.showCounters !== undefined
        ) {
          this.config = config;
        }
      } catch (ex) {
        console.error(ex);
      }
    },
    async saveCurrentLocalGroups() {
      const loadingFinisher = useApp().getLoadingFinisher();
      try {
        const allData = this.localGroupsArray.reduce((data, localGroup) => {
          data[localGroup.folder] ??= [];
          data[localGroup.folder].push(localGroup.id);
          return data;
        }, {} as Record<string, number[]>);
        const stringifyStr = JSON.stringify(allData);
        await useVk().setVkStorage("groups", stringifyStr);
      } finally {
        loadingFinisher();
      }
    },
    async autoSaveCurrentLocalGroups() {
      if (!this.config.autoSave) {
        return;
      }

      await this.saveCurrentLocalGroups();
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
    groupsReverse(): IGroup[] {
      return this.groups.reverse();
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
