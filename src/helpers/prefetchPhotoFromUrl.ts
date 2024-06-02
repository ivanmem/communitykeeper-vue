import { IPhoto } from "@/store/groups/types";
import { PhotoHelper } from "@/helpers/PhotoHelper";

export function prefetchPhotoFromUrl(
  url: string | undefined,
): Promise<Event> | undefined {
  if (!url) {
    return;
  }

  return new Promise<Event>((resolve, reject) => {
    const img = new Image();
    img.onload = resolve;
    img.onerror = reject;
    img.src = url;
  });
}

export function prefetchPhoto(
  photo: IPhoto | undefined,
): Promise<Event> | undefined {
  return prefetchPhotoFromUrl(PhotoHelper.getOriginalSize(photo?.sizes)?.url);
}
