import { toStr } from "@/helpers/toStr";

export function errorToString(ex: any) {
  if (toStr(ex).includes("Access denied")) {
    return "Ошибка доступа";
  }

  return ex.toString();
}
