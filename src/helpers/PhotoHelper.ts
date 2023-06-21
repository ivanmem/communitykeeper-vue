import { IPhoto, IPhotoSize } from "vkontakte-api";

export class PhotoHelper {
  static getOriginalSize(sizes: IPhotoSize[] | undefined) {
    if (!sizes) {
      return undefined;
    }

    let originalSize: IPhotoSize = sizes[0];
    sizes.forEach((size) => {
      if (size.height * size.width > originalSize.width * originalSize.height) {
        originalSize = size;
      }
    });
    return originalSize;
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

  static getPhotoUrl(ownerId: number | string, photoId: number) {
    return `vk.com/photo${ownerId}_${photoId}`;
  }

  static getPhotoFileName(photo: IPhoto) {
    return `photo${photo.owner_id}_${photo.id}.jpg`;
  }
}
