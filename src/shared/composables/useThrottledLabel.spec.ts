import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { nextTick, ref } from "vue";
import { useThrottledLabel } from "@/shared/composables/useThrottledLabel";

describe("useThrottledLabel", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  it("сразу показывает начальный текст", () => {
    const label = useThrottledLabel("1 из 10", false, 1000);

    expect(label.value).toBe("1 из 10");
  });

  it("обновляет текст не чаще раза в заданный интервал", async () => {
    const text = ref("1 из 10");
    const label = useThrottledLabel(text, false, 1000);

    text.value = "2 из 10";
    await nextTick();
    text.value = "3 из 10";
    await nextTick();
    expect(label.value).toBe("2 из 10");

    await vi.advanceTimersByTimeAsync(1000);
    expect(label.value).toBe("3 из 10");
  });

  it("скрывается сразу, не дожидаясь интервала", async () => {
    const text = ref("0 из 0+");
    const hidden = ref(false);
    const label = useThrottledLabel(text, hidden, 1000);
    text.value = "0 из 10";
    await nextTick();

    hidden.value = true;

    expect(label.value).toBeUndefined();
  });

  it("после показа выводит актуальный текст по истечении интервала", async () => {
    const text = ref("1 из 10");
    const hidden = ref(true);
    const label = useThrottledLabel(text, hidden, 1000);
    text.value = "2 из 10";
    await nextTick();
    text.value = "5 из 10";
    await nextTick();

    hidden.value = false;
    await vi.advanceTimersByTimeAsync(1000);

    expect(label.value).toBe("5 из 10");
  });
});
