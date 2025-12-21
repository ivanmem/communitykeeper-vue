import { toStr } from "@/shared/helpers/toStr";
import { t } from "@/i18n";

export function errorToString(ex: any) {
  if (toStr(ex).includes("Access denied")) {
    return t("errors.accessDenied");
  }

  return ex.toString();
}
