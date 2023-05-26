export function isNullOrUndefined<T>(
  value: T | undefined | null
): value is undefined | null {
  return value === null || value === undefined;
}
