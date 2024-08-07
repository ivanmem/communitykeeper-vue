import isNumeric from "@/shared/helpers/isNumeric";
import { replaceCommaNumber } from "@/shared/helpers/replaceCommaNumber";

export function toNumberOrUndefined(
  str: string | number | undefined | null,
): number | undefined {
  str = replaceCommaNumber(str);
  if (isNumeric(str)) {
    return Number(str);
  }

  return undefined;
}
