import type {
  PhotosPhoto,
  PhotosPhotoSizes,
} from "@vkontakte/api-schema-typescript";

// В официальной схеме VK API все поля необязательные,
// а в наших запросах (photo_sizes=1) эти поля приходят всегда

/** @link https://dev.vk.com/ru/reference/objects/photo-sizes */
export type IPhotoSize = Required<
  Pick<PhotosPhotoSizes, "type" | "width" | "height" | "url">
>;

/** Поля, которые есть у любого объекта VK с владельцем */
export type IObjectSharedProps = Required<Pick<PhotosPhoto, "id" | "owner_id">>;
