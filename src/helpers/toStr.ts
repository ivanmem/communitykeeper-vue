import { isNullOrUndefined } from "./isNullOrUndefined";

export function toStr<T>(v: T): string {
  if (isNullOrUndefined(v)) {
    return "";
  }

  if (typeof v === "string") {
    return v;
  }

  if (typeof v === "object") {
    return JSON.stringify(v);
  }

  return "" + v;
}
