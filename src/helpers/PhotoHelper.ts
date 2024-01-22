import { IPhotoSize } from "vkontakte-api";
import last from "lodash/last";
import isNumeric from "@/helpers/isNumeric";
import { VK_MAX_PHOTO_SIZE } from "@/common/consts";
import { ComputedRef } from "vue";
import { IPhoto, IPhotoKey } from "@/store/groups/types";
import bridge from "@vkontakte/vk-bridge";
import { saveAs } from "file-saver";

export class PhotoHelper {
  static getOriginalSize(sizes: IPhotoSize[] | undefined) {
    if (!sizes?.length) {
      return undefined;
    }

    let originalSize: IPhotoSize = last(sizes)!;
    sizes.forEach((size) => {
      if (size.width * size.height > originalSize.width * originalSize.height) {
        originalSize = size;
      }
    });
    return originalSize;
  }

  static getPreviewSize(
    sizes: IPhotoSize[] | undefined,
    previewSizes: { width: number; height: number }
  ) {
    if (!sizes?.length) {
      return undefined;
    }

    let originalSize: IPhotoSize = sizes[0]!;
    const previewWidth = previewSizes.width * window.devicePixelRatio;
    const previewHeight = previewSizes.height * window.devicePixelRatio;
    return (
      sizes.find((size) => {
        if (size.width >= previewWidth && size.height >= previewHeight) {
          originalSize = size;
          return true;
        }
      }) ?? originalSize
    );
  }

  static getAlbumUrl(ownerId: number | string, albumId: number | string) {
    if (+albumId === -6) {
      albumId = 0;
    }

    if (albumId === "wall" || albumId == -7) {
      albumId = "00";
    }

    return `vk.com/album${ownerId}_${albumId}`;
  }

  static getOwnerUrl(ownerId: number | string) {
    if (!isNumeric(ownerId)) {
      return `vk.com/${ownerId}`;
    }

    if (+ownerId < 0) {
      return `vk.com/public${-ownerId}`;
    }

    return `vk.com/id${ownerId}`;
  }

  static getPhotoUrl(ownerId: number | string, photoId: number | string) {
    return `vk.com/photo${ownerId}_${photoId}`;
  }

  static getPhotoKey(
    ownerId: number | string,
    photoId: number | string
  ): IPhotoKey {
    return `photo${ownerId}_${photoId}`;
  }

  static getPhotoKeyOrUndefined(
    ownerId: number | string | undefined,
    photoId: number | string | undefined
  ): IPhotoKey | undefined {
    if (ownerId === undefined || photoId === undefined) {
      return undefined;
    }
    return this.getPhotoKey(ownerId, photoId);
  }

  static getPhotoFileName(photo: IPhoto) {
    return `photo${photo.owner_id}_${photo.id}.jpg`;
  }

  static async downloadPhoto(photo: IPhoto) {
    const originalSize = PhotoHelper.getOriginalSize(photo.sizes);
    const filename = PhotoHelper.getPhotoFileName(photo);
    if (originalSize) {
      try {
        await bridge.send("VKWebAppDownloadFile", {
          url: originalSize.url,
          filename
        });
      } catch (ex: any) {
        // 6 - VKWebAppDownloadFile. Unsupported platform
        if (ex?.error_data?.error_code === 6) {
          saveAs(originalSize.url, filename);
        }
      }
    }
  }

  /** @description Это максимальный размер фото для ВКонтакте? */
  static isMaxSize(originalSize: IPhotoSize) {
    return (
      originalSize.width >= VK_MAX_PHOTO_SIZE.width &&
      originalSize.height >= VK_MAX_PHOTO_SIZE.height
    );
  }

  /** @description Это фото меньше указанного размера по ширине и длине и оно не равно максимальному размеру для ВКонтакте?
   * Если хотя бы по одной стороне больше либо равно - возвращается false */
  static isPhotoLessSizeAndNotMaxSize(
    photo: IPhoto,
    size: { width: ComputedRef<number>; height: ComputedRef<number> }
  ) {
    const originalSize = PhotoHelper.getOriginalSize(photo.sizes)!;
    if (PhotoHelper.isMaxSize(originalSize)) {
      return false;
    }

    return (
      size.width.value > originalSize.width &&
      size.height.value > originalSize.height
    );
  }
}
