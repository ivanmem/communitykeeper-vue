import { isNullOrUndefined } from "./isNullOrUndefined";
import { replaceCommaNumber } from "./replaceCommaNumber";

export default function isNumeric(
  str: string | number | undefined | null,
  replaceComma = false
): str is number | string {
  if (isNullOrUndefined(str)) {
    return false;
  }
  if (typeof str !== "number" && typeof str !== "string"!) {
    return false;
  }

  if (replaceComma) {
    str = replaceCommaNumber(str);
  }

  return !isNaN(str as any) && !isNaN(parseFloat(str as any));
}
