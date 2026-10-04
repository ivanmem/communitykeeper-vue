import { delay } from "es-toolkit";

/** @description Выдаёт вызовам очередь так, чтобы они начинались не чаще rps раз в секунду */
export function createRateLimiter(rps: number) {
  const interval = Math.ceil(1000 / rps);
  // Момент, когда освободится следующее место в очереди
  let freeAt = 0;

  return async function waitTurn() {
    const now = Date.now();
    if (freeAt < now) {
      freeAt = now + interval;
      return;
    }

    const waitMs = freeAt - now;
    freeAt += interval;
    await delay(waitMs);
  };
}
