import { IPhoto, IPhotoSize } from "vkontakte-api";
import last from "lodash/last";
import isNumeric from "@/helpers/isNumeric";
import { VK_MAX_PHOTO_SIZE } from "@/common/consts";
import { ComputedRef } from "vue";

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

  static getPreviewSize(sizes: IPhotoSize[] | undefined) {
    if (!sizes?.length) {
      return undefined;
    }

    let originalSize: IPhotoSize = sizes[0]!;
    return (
      sizes.find((size) => {
        if (size.width * size.height > 450 * 450) {
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

    if (albumId === "wall") {
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

  static getPhotoUrl(ownerId: number | string, photoId: number) {
    return `vk.com/photo${ownerId}_${photoId}`;
  }

  static getPhotoFileName(photo: IPhoto) {
    return `photo${photo.owner_id}_${photo.id}.jpg`;
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
    size: { width: ComputedRef<number>; height: ComputedRef<number> },
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
