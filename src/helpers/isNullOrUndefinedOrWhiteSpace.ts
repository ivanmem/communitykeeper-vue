export function isNullOrUndefinedOrWhiteSpace(
  value: string | undefined | null
): value is undefined | null | "" {
  return value === null || value === undefined || value.trim() === "";
}
