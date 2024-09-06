import { defineStore } from "pinia";
import { GroupState, IGroup, IGroupCounters, IGroupsExport, ILocalGroup } from "@/store/groups/types";
import toNumber from "lodash-es/toNumber";
import { useVk } from "@/store/vk/vk";
import { isGroupBanned } from "@/shared/helpers/isGroupBanned";
import { IAppInitOptions, useApp } from "@/store/app/app";
import { watch } from "vue";
import GroupHelper from "@/shared/helpers/GroupHelper";
import { from } from "linq-to-typescript";
import { saveAs } from "file-saver";
import { toStr } from "@/shared/helpers/toStr";
import { watchDebounced } from "@vueuse/core";
import { folderRules, maxFolderLength } from "@/shared/constants/formConsts";
import { actionSwipesDefaults, actionSwipesDict, VK_STORAGE } from "@/shared/constants/consts";
import last from "lodash-es/last";

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

export interface GallerySwipesConfig {
  onLeft?: string;
  onRight?: string;
  onUp?: string;
  onDown?: string;
}

export interface IGroupsConfig {
  autoSave: boolean;
  showCounters: boolean;
  eruda?: boolean;
  originalSizePhoto?: boolean;
  reverseOrder?: boolean;
  skipLowResolutionPhotos?: boolean;
  gallery?: boolean;
  opacityGalleryCounter?: number;
  swipes?: GallerySwipesConfig;
  previewSizeShadow?: boolean;
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
      config: { autoSave: true, showCounters: true, gallery: true },
      spaceUsed: 0,
      cachedGroupsData: {},
    };
  },
  actions: {
    async init(opts: IAppInitOptions) {
      try {
        await this.updateCurrentLocalGroups();
      } catch (ex: any) {
        console.error("init groups", ex);
      }

      this.isInit = true;

      watchDebounced(
        () => toStr(this.config),
        () => {
          return useVk().setVkStorageDict({
            groupsConfig: this.config,
          });
        },
        { debounce: 500 },
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
        () => this.foldersSet,
        () => {
          if (this.foldersSet.has(this.filters.folder)) {
            return;
          }

          this.filters.folder = "";
        },
        { immediate: true },
      );
      console.info("groups store init");
    },
    async updateCurrentLocalGroups() {
      this.localGroupsArray.length = 0;
      const dictLocalGroups = await this.getCurrentLocalGroups();
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
      const ids = from(Object.keys(this.localGroups))
        .select(toNumber)
        .where((id) => !this.groupsMap.has(id))
        .toArray();
      if (ids.length === 0) {
        return false;
      }

      const apiService = await useVk().getApiService();
      if (!apiService) {
        return false;
      }

      const groups = await apiService.getMapGroupsByIds(ids);
      const badGroups = new Set<number>();
      for (let [id, group] of groups) {
        if (group == undefined) {
          badGroups.add(id);
          continue;
        }

        this.setGroup(group);
      }

      this.removeLocalGroup(badGroups);
      return true;
    },
    setGroup(group: IGroup) {
      GroupHelper.getState(group);
      this.groupsMap.set(group.id, group);
      return group;
    },
    setSpaceUsed(chunksCount: number) {
      this.spaceUsed = +(
        chunksCount === 0 ? 0 : chunksCount / (VK_STORAGE.chunksMaxCount * 0.01)
      ).toFixed(0);
    },
    getLocalGroupById(id: number): ILocalGroup | undefined {
      return this.localGroups[id];
    },
    getExport(folders: string[]): IGroupsExport {
      const groupIdsDictByFolderName = folders.reduce(
        (dict, folder) => {
          dict[folder] ??= [];
          dict[folder].push(...this.groupIdsDictByFolderName[folder]);
          return dict;
        },
        {} as Record<string, number[]>,
      );
      return { groupIdsDictByFolderName };
    },
    downloadExport(groupsExport: IGroupsExport) {
      const exportJson = JSON.stringify(groupsExport);
      // Создаем новый Blob-объект (данные в двоичном виде)
      const blob = new Blob([exportJson], { type: "text/plain;charset=utf-8" });
      const filename = `xg-backup-${new Date().toLocaleDateString()}.json`;
      // Сохраняем файл на компьютере пользователя
      saveAs(blob, filename, { autoBom: true });
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

      const apiService = await useVk().getApiService();
      const groups = await apiService.getGroupsByLinksOrIds([id]);
      return groups[0];
    },
    addLocalGroup(localGroup: ILocalGroup) {
      // группы с пустым, запрещённым или длинным названием папки запрещены
      if (
        typeof (localGroup.folder as any) !== "string" ||
        !localGroup.folder.trim() ||
        localGroup.folder.trim().length > maxFolderLength ||
        folderRules.some((x) => x(localGroup.folder) !== true)
      ) {
        return;
      }

      // группы с некорректным ID запрещены
      if (
        typeof (localGroup.id as any) !== "number" ||
        localGroup.id < 0 ||
        !Number.isInteger(localGroup.id)
      ) {
        return;
      }

      const currentIndex = this.localGroupsArray.findIndex(
        (x) => x.id === localGroup.id,
      );
      // если группа уже существует - перезаписываем
      if (currentIndex !== -1) {
        this.localGroupsArray[currentIndex] = localGroup;
        return;
      }

      this.localGroupsArray.push(localGroup);
    },
    removeLocalGroup(id: number | Set<number>) {
      this.localGroupsArray = this.localGroupsArray.filter((x) =>
        typeof id === "number" ? x.id !== id : !id.has(x.id),
      );
    },
    removeLocalGroups() {
      this.localGroupsArray.length = 0;
      this.groupsMap.clear();
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
    clearCachedGroups() {
      this.cachedGroupsData = {};
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

      const apiService = await useVk().getApiService();
      const counters = await apiService
        .addRequestToQueue<any, IGroup[]>({
          method: "groups.getById",
          params: {
            group_id: group.id,
            fields: "counters",
          },
        })
        .catch(() => [{ counters: {} }] as IGroup[])
        .then(([resultGroup]) => resultGroup?.counters ?? {});
      this.cachedGroupsData[group.id] = {
        date: new Date().toISOString(),
        data: { counters },
      };
      return counters;
    },
    async updateGroupsConfig(config?: IGroupsConfig) {
      try {
        config ??= await useVk().getVkStorageObject("groupsConfig");
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
            data[localGroup.folder] ??= new Set();
            data[localGroup.folder].add(localGroup.id);
            return data;
          },
          {} as Record<string, Set<number>>,
        );
        const stringifyStr = JSON.stringify(allData, (_key, value) => {
          return value instanceof Set ? [...value] : value;
        });
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
    updateRandomIndex() {
      this.groupStates.forEach((groupState) => {
        groupState.randomIndex = Math.random();
      });
    },
    setSwipeKey(swipeKey: keyof GallerySwipesConfig, value?: string) {
      console.log(value);
      const swipes = { ...this.config.swipes };
      console.log(swipes);
      swipes[swipeKey] = value || undefined;
      this.config.swipes = swipes;
    },
    switchFiltersFolderToNext() {
      if (!this.filters.folder) {
        this.filters.folder = this.folders[0] ?? "";
        return;
      }

      const currentIndex = this.folders.indexOf(this.filters.folder);
      if (
        currentIndex === this.filters.folder.length - 1 ||
        currentIndex === -1
      ) {
        this.filters.folder = "";
        return;
      }

      this.filters.folder = this.folders[currentIndex + 1] ?? "";
    },
    /** Переключить */
    switchFiltersFolderToPrev() {
      if (!this.filters.folder) {
        this.filters.folder = last(this.folders) ?? "";
        return;
      }

      const currentIndex = this.folders.indexOf(this.filters.folder);
      if (currentIndex === 0 || currentIndex === -1) {
        this.filters.folder = "";
        return;
      }

      this.filters.folder = this.folders[currentIndex - 1];
    },
  },
  getters: {
    swipesConfig(): Required<GallerySwipesConfig> {
      return Object.keys(actionSwipesDefaults).reduce((config, key) => {
        const configKey = key as keyof GallerySwipesConfig;
        const value = this.config.swipes?.[configKey];
        config[configKey] = value ?? "";
        if (!actionSwipesDict.has(config[configKey])) {
          config[configKey] = actionSwipesDefaults[configKey];
        }

        return config;
      }, {} as Required<GallerySwipesConfig>);
    },
    groupStates(): GroupState[] {
      const array: GroupState[] = [];
      this.groupsMap.forEach((group) => {
        array.push(GroupHelper.getState(group));
      });
      return array;
    },
    folders(): string[] {
      return from(this.localGroupsArray)
        .select((x) => x.folder)
        .distinct()
        .toArray();
    },
    foldersSet(): Set<string> {
      return new Set(this.folders);
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
        if (!localGroup) {
          return false;
        }

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
    pick: ["cachedGroupsData", "filters"],
  },
});
