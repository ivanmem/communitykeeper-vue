import { VKAPI } from "vkontakte-api";
import { IRequestConfig } from "vkontakte-api/dist/types/shared";
import { sleep } from "@/helpers/sleep";
import { useVk } from "@/store/vk/vk";
import { IAlbumItem, PhotosGetAlbums } from "@/store/vk/IAlbumItem";
import { IGroup, IPhoto } from "@/store/groups/types";
import { from } from "linq-to-typescript";
import isNumber from "lodash-es/isNumber";

export class VkApiService {
  cache: {
    currentAlbum?: IAlbumItem;
  } = {};

  constructor(public api: VKAPI) {
  }

  async addRequestToQueue<P extends {} = any, R = any>(
    config: IRequestConfig<P>,
  ): Promise<R> {
    try {
      return await this.api.addRequestToQueue<P, R>(config);
    } catch (ex: any) {
      console.warn("api error", { config, ex });
      const errorCode = ex?.errorInfo?.error_code;
      if (errorCode === 6) {
        await sleep(2000);
        // костыль для игнорирования Too many requests per second
        return await this.addRequestToQueue<P, R>(config);
      } else if (errorCode === 5) {
        // костыль для повторной авторизации
        await useVk().initVk();
        return await this.addRequestToQueue<P, R>(config);
      } else {
        throw ex;
      }
    }
  }

  getAlbums(
    owner_id: number | string,
    offset: number | undefined = undefined,
    count: number | undefined = undefined,
  ): Promise<PhotosGetAlbums> {
    return this.addRequestToQueue({
      method: "photos.getAlbums",
      params: {
        owner_id,
        need_system: 1,
        need_covers: 1,
        photo_sizes: 1,
        offset,
        count,
      },
    });
  }

  async getCachedAlbum(
    owner_id: number | string,
    album_id: number | string,
  ): Promise<IAlbumItem | undefined> {
    const album = this.cache.currentAlbum;
    if (album && album.owner_id == owner_id && album.id == album_id) {
      return this.cache.currentAlbum;
    }

    let response = await this.addRequestToQueue({
      method: "photos.getAlbums",
      params: {
        owner_id,
        album_ids: album_id,
        need_system: 1,
        need_covers: 1,
        photo_sizes: 1,
      },
    });
    this.cache.currentAlbum = await response.items.find(
      (x: IAlbumItem) => x.id == album_id,
    );
    return this.cache.currentAlbum;
  }

  photosGet(params: {
    owner_id: number | string;
    album_id: number | string;
    offset?: number;
    count?: number;
    rev: 1 | 0;
    extended: 1 | 0;
    photo_sizes: 1 | 0;
  }): Promise<{ items: IPhoto[]; count: number }> {
    return this.addRequestToQueue({
      method: "photos.get",
      params,
    });
  }

  async createAlbumItem(params: {
    owner_id: number;
    album_id: number;
    title: string;
  }): Promise<IAlbumItem> {
    const result = await this.photosGet({
      owner_id: params.owner_id,
      album_id: params.album_id,
      count: 1,
      offset: 0,
      rev: 0,
      extended: 0,
      photo_sizes: 1,
    });
    return {
      owner_id: params.owner_id,
      size: result.count,
      title: params.title,
      id: params.album_id,
      sizes: result.items[0]?.sizes,
    };
  }

  /** @description Метод для получения album_id. Метод недоступен доступен только для фото из групп. */
  async getAlbumIdFromPhotoIdAndOwnerId(ownerId: string | number, photoId: string | number) {
    const result = await this.addRequestToQueue({
      method: "photos.getById",
      params: {
        photos: `${ownerId}_${photoId}`,
        access_token: useVk().token?.access_token,
      },
    });
    return result[0].album_id;
  }

  getGroupsByIdsRaw = (ids: (number | string)[]): Promise<IGroup[]> => {
    return this.addRequestToQueue({
      method: "groups.getById",
      params: {
        group_ids: ids.join(),
        fields: "counters,member_status",
      },
    });
  };

  getGroupsByLinksOrIds = async (
    linksOrIds: (string | number)[],
  ): Promise<IGroup[]> => {
    try {
      return await from(linksOrIds)
        .select((value) => {
          if (isNumber(value)) {
            return `${value}`;
          }

          if (
            value.includes(".com/public") &&
            isNumber(value.substring(value.lastIndexOf(".com/public") + 11))
          ) {
            return value.substring(value.lastIndexOf(".com/public") + 11);
          }

          return value.substring(value.lastIndexOf("/") + 1);
        })
        .chunk(500)
        .selectManyAsync(this.getGroupsByIdsRaw)
        .toArray();
    } catch (ex: any) {
      console.warn(ex);
      return [];
    }
  };

  getMapGroupsByIds = async (
    ids: number[],
  ): Promise<Map<number, IGroup | undefined>> => {
    try {
      const array = await from(ids)
        .chunk(500)
        .selectManyAsync(this.getGroupsByIdsRaw)
        .toMap((x) => x.id);
      return ids.reduce((previousValue, currentValue) => {
        previousValue.set(
          currentValue,
          array.get(currentValue)?.[0] ?? undefined,
        );
        return previousValue;
      }, new Map<number, IGroup | undefined>());
    } catch (ex: any) {
      console.warn(ex);
      return new Map();
    }
  };
}
