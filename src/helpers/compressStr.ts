import { compress, decompress } from "brotli-compress";

export async function compressStr(str: string) {
  if (str.length === 0) {
    return "";
  }

  return new TextDecoder().decode(
    await compress(new TextEncoder().encode(str), { quality: 11 }),
  );
}

export async function decompressStr(compressStr: string) {
  if (compressStr.length === 0) {
    return "";
  }

  return new TextDecoder().decode(
    await decompress(new TextEncoder().encode(compressStr)),
  );
}
