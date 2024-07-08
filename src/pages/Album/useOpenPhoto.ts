import { MaybeRefOrGetter, toValue } from "vue";
import { openUrl } from "@/shared/helpers/openUrl";
import { PhotoHelper } from "@/shared/helpers/PhotoHelper";

export function useOpenPhoto(photo: MaybeRefOrGetter) {
  return () => {
    openUrl(
      `//${PhotoHelper.getPhotoUrl(toValue(photo).owner_id, toValue(photo).id)}`,
    );
  };
}
