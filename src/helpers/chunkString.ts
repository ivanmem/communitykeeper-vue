const MAX_SIZE_ONE_VALUE = 2236;

export function chunkString(
  str: string,
  chunkSize: number = MAX_SIZE_ONE_VALUE
): string[] {
  const arr: string[] = [];
  let i = 0;
  while (i < str.length) {
    arr.push(str.slice(i, i + chunkSize));
    i += chunkSize;
  }
  return arr;
}
