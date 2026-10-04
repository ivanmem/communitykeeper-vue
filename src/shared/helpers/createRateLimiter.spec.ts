import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { createRateLimiter } from "@/shared/helpers/createRateLimiter";

describe("createRateLimiter", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("пропускает первый вызов сразу, а следующие — с интервалом", async () => {
    const waitTurn = createRateLimiter(3);
    const started: number[] = [];

    for (let i = 0; i < 3; i++) {
      waitTurn().then(() => started.push(i));
    }

    await vi.advanceTimersByTimeAsync(0);
    expect(started).toEqual([0]);
    await vi.advanceTimersByTimeAsync(334);
    expect(started).toEqual([0, 1]);
    await vi.advanceTimersByTimeAsync(334);
    expect(started).toEqual([0, 1, 2]);
  });

  it("не задерживает вызов после паузы", async () => {
    const waitTurn = createRateLimiter(3);
    await waitTurn();
    await vi.advanceTimersByTimeAsync(1000);

    let started = false;
    waitTurn().then(() => {
      started = true;
    });
    await vi.advanceTimersByTimeAsync(0);

    expect(started).toBe(true);
  });
});
