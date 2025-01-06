import { compressToBase64 } from "lz-string";

export function compressAndEncode(data: string): string {
  return compressToBase64(data);
}

export function compressAndEncodeObject(obj: object): string {
  return compressAndEncode(JSON.stringify(obj));
}
