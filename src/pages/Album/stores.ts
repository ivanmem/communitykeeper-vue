import { createInjectionState } from "@vueuse/core";
import { ComputedRef, Ref } from "vue";
import { IPhoto } from "@/store/groups/types";
import { identity } from "es-toolkit";

export const [provideAlbumPageContext, injectAlbumPageContext] =
  createInjectionState(
    identity<{
      ownerId: Readonly<Ref<number | string>>;
      albumId: Readonly<Ref<number | string>>;
      photoId: Readonly<Ref<number | string | undefined>>;
    }>,
  );

export const [provideAlbumContext, injectAlbumContext] = createInjectionState(
  identity<{ currentPhoto: ComputedRef<IPhoto | undefined> }>,
);
