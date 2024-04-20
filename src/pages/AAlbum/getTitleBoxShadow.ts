import { IPhotoSize } from "vkontakte-api";
import { VK_MAX_PHOTO_SIZE } from "@/common/consts";

export function getTitleBoxShadow(size: IPhotoSize): string {
  const redColor = [255, 46, 78];
  const greenColor = [120, 239, 152];
  let factor =
    size.width > size.height
      ? size.width / VK_MAX_PHOTO_SIZE.width
      : size.height / VK_MAX_PHOTO_SIZE.height;
  factor = Math.min(Math.max(factor, 0), 1);
  // При factor равным 0.5 opacity равен 0. Чем дальше от середины, тем больше opacity
  let opacity = factor >= 0.5 ? (factor - 0.5) * 2 : factor * 2;
  // Умножаем на 2, чтобы усилить эффект
  opacity *= 2;
  opacity = Math.min(Math.max(opacity, 0.2), 1);
  const color = redColor.map((start, i) => {
    const end = greenColor[i];
    return Math.round(start + factor * (end - start));
  });
  return `0 0 1.5px 2.5px rgba(${color[0]}, ${color[1]}, ${color[2]}, ${opacity}) inset`;
}
