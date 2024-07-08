import { useRouter } from "vue-router";
import { openUrl } from "@/shared/helpers/openUrl";

const startWithExternalArray = ["//", "http://", "https://"];

/** @description Возвращает функцию, которая открывает ссылки начинающиеся с [//, http://, https://] в новой вкладке, а остальные внутри приложения */
export function useSmartOpenUrl() {
  const router = useRouter();

  return (url: string) => {
    if (startWithExternalArray.some((s) => url.startsWith(s))) {
      return openUrl(url);
    }

    return router.push(url);
  };
}
