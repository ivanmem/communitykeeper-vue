export function chunkString(str: string, chunkSize: number): string[] {
  const arr: string[] = [];
  let i = 0;
  while (i < str.length) {
    arr.push(str.slice(i, i + chunkSize));
    i += chunkSize;
  }
  return arr;
}
