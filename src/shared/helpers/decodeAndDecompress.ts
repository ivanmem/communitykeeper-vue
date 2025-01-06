import { decompressFromBase64 } from "lz-string";

export function decodeAndDecompress(data: string): string {
  return decompressFromBase64(data);
}

export function decodeAndDecompressObject(data: string): any {
  return JSON.parse(decodeAndDecompress(data));
}
