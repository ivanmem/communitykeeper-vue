import { computed } from "vue";
import { platform } from "@vkontakte/vkui";

export const AlbumsPreviewSizes = computed(() => {
  const plaftorm = platform();
  if (plaftorm === "vkcom") {
    return {
      width: 245,
      height: 165,
    };
  } else {
    return {
      width: 170,
      height: 115,
    };
  }
});
