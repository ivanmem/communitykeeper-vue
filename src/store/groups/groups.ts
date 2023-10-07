import { defineStore } from "pinia";
import {
  IGroup,
  IGroupCounters,
  IGroupsExport,
  ILocalGroup,
} from "@/store/groups/types";
import toNumber from "lodash/toNumber";
import { useVk } from "@/store/vk/vk";
import { saveAs } from "file-saver";
import { isGroupBanned } from "@/helpers/isGroupBanned";
import { getGroupsByLinksOrIds } from "@/helpers/getGroupsByIds";
import { useApp } from "@/store/app/app";
import { watch } from "vue";
import GroupHelper from "@/helpers/GroupHelper";
import { setEruda } from "@/helpers/setEruda";
import { from } from "linq-to-typescript";

export interface FiltersType {
  folder: string;
  search: string;
  access: OnlyAccessEnum;
  sort?: GroupsSortEnum;
  sortDesc?: boolean;
}

export enum GroupsSortEnum {
  date,
  random,
  photos,
  albums,
  articles,
  videos,
}

export const groupsSortKeys = Object.keys(GroupsSortEnum).reduce(
  (dict, key) => {
    dict.set(GroupsSortEnum[key as any] as any, key);
    return dict;
  },
  new Map<number, any>(),
);

export const countersKeys: Set<keyof IGroupCounters> = new Set([
  "photos",
  "albums",
  "topics",
  "videos",
  "market",
  "articles",
  "narratives",
  "addresses",
  "clips",
  "clips_followers",
]);

export enum OnlyAccessEnum {
  none,
  access,
  noAccess,
  open,
  close,
}

interface GroupsState {
  localGroupsArray: ILocalGroup[];
  groupsMap: Map<number, IGroup>;
  filters: FiltersType;
  isInit: boolean;
  config: IGroupsConfig;
  spaceUsed: number;
  cachedGroupsData: Record<
    string | number,
    {
      date: string;
      data: Partial<IGroup>;
    }
  >;
}

export interface IGroupsConfig {
  autoSave: boolean;
  showCounters: boolean;
  eruda?: boolean;
  originalSizePhoto?: boolean;
  reverseOrder?: boolean;
  skipLowResolutionPhotos?: boolean;
}

export const useGroups = defineStore("groups", {
  state: (): GroupsState => {
    return {
      localGroupsArray: [],
      groupsMap: new Map(),
      filters: {
        folder: "",
        search: "",
        access: OnlyAccessEnum.none,
        sort: GroupsSortEnum.date,
        sortDesc: false,
      },
      isInit: false,
      config: { autoSave: true, showCounters: true },
      spaceUsed: 0,
      cachedGroupsData: {},
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
        () => {
          return this.saveCurrentConfig();
        },
        { deep: true },
      );
      // если меняется настройка showCounters - очищаем ручное состояние скрытия счётчиков
      watch(
        () => this.config.showCounters,
        () => {
          for (let value of this.groupsMap.values()) {
            delete GroupHelper.getState(value).hideCounters;
          }
        },
      );
      watch(
        () => this.config.eruda,
        useApp().wrapLoading(() => {
          return setEruda(Boolean(this.config.eruda));
        }),
        { immediate: this.config.eruda },
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
      for (const group of groups) {
        this.setGroup(group);
      }
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
      const blob = new Blob([exportJson], { type: "text/plain;charset=utf-8" });
      // Сохраняем файл на компьютере пользователя
      saveAs(blob, "xg-backup.json", { autoBom: true });
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
          (x) => x.id !== localGroup.id,
        );
      }

      this.localGroupsArray.push(localGroup);
    },
    removeLocalGroup(id: number | Set<number>) {
      this.localGroupsArray = this.localGroupsArray.filter((x) =>
        typeof id === "number" ? x.id !== id : !id.has(x.id),
      );
    },
    removeLocalGroups() {
      this.localGroupsArray = [];
    },
    async loadGroupCounters(group: IGroup) {
      if (group.counters || isGroupBanned(group)) {
        return group;
      }

      group.counters = await this.getGroupCounters(group);
      return group;
    },
    clearCachedGroupIfExpired(group: IGroup) {
      const cache = this.cachedGroupsData[group.id];
      if (!cache) {
        return;
      }

      let days = Math.floor(
        (+new Date() - +new Date(cache.date)) / (1000 * 60 * 60 * 24),
      );
      if (days > 3) {
        delete this.cachedGroupsData[group.id];
      }
    },
    getCachedGroup(group: IGroup) {
      this.clearCachedGroupIfExpired(group);
      return this.cachedGroupsData[group.id]?.data;
    },
    async getGroupCounters(group: IGroup) {
      const cachedGroup = this.getCachedGroup(group);
      if (cachedGroup?.counters) {
        return cachedGroup.counters;
      }

      const [{ counters }] = await useVk()
        .addRequestToQueue<any, IGroup[]>({
          method: "groups.getById",
          params: {
            group_id: group.id,
            fields: "counters",
          },
        })
        .catch(() => [{ counters: {} }] as IGroup[]);
      this.cachedGroupsData[group.id] = {
        date: new Date().toISOString(),
        data: { counters },
      };
      return counters;
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
        const allData = this.localGroupsArray.reduce(
          (data, localGroup) => {
            data[localGroup.folder] ??= [];
            data[localGroup.folder].push(localGroup.id);
            return data;
          },
          {} as Record<string, number[]>,
        );
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
      return from(this.localGroupsArray)
        .select((x) => x.folder)
        .distinct()
        .toArray();
    },
    groupsIds(): number[] {
      return Array.from(this.groupsMap.keys());
    },
    groupsIdsReverse(): number[] {
      return from(this.groupsMap.keys()).reverse().toArray();
    },
    localGroups(): Record<number | string, ILocalGroup> {
      return from(this.localGroupsArray).toObject((x) => x.id);
    },
    groupIdsDictByFolderName(): Record<string, number[]> {
      return this.localGroupsArray.reduce(
        (dict, value) => {
          dict[value.folder] ??= [];
          dict[value.folder].push(value.id);
          return dict;
        },
        {} as Record<string, number[]>,
      );
    },
    groupIdsByCurrentFolderName(): number[] {
      if (!this.filters.folder) {
        return this.groupsIds;
      }

      return this.groupIdsDictByFolderName[this.filters.folder];
    },
    // Все счётчики текущей папки загружены?
    isGroupCountersCurrentFolderLoaded(): boolean {
      return !this.groupsIds.some((id) => {
        const group = this.groupsMap.get(id)!;
        const localGroup = this.localGroups[id];
        if (this.filters.folder && this.filters.folder !== localGroup.folder) {
          return false;
        }

        if (GroupHelper.getState(group).isBanned) {
          return false;
        }

        return !group.counters;
      });
    },
    // Текущая сортировка - это сортировка по счётчикам?
    isGroupCountersSort(): boolean {
      const key = groupsSortKeys.get(this.filters.sort ?? GroupsSortEnum.date);
      return key && countersKeys.has(key);
    },
  },
  persist: {
    storage: localStorage,
    paths: ["cachedGroupsData", "filters"],
  },
});
