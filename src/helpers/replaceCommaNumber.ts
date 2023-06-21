export function replaceCommaNumber<T = any>(value: T): T {
  if (typeof value === "string") {
    value = value.replace(",", ".") as any;
  }

  return value;
}
