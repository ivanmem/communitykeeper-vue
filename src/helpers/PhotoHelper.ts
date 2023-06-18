import { IPhotoSize } from "vkontakte-api";

export class PhotoHelper {
  static getOriginalSize(sizes: IPhotoSize[]) {
    let originalSize: IPhotoSize = sizes[0];
    sizes.forEach((size) => {
      if (size.height * size.width > originalSize.width * originalSize.height) {
        originalSize = size;
      }
    });
    return originalSize;
  }
}
