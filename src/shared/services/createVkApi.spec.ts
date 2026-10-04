import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { noop } from "es-toolkit";
import { createVkApi } from "@/shared/services/createVkApi";
import { VkTransportError } from "@/shared/services/createJsonpSendRequest";

// Способ доставки запроса скрыт за этими помощниками: тесты ниже описывают поведение клиента

class FakeScript {
  src = "";
  fetchPriority = "";
  onerror: (() => void) | null = null;
  remove = vi.fn();
}

let scripts: FakeScript[];

function sentRequests() {
  return scripts.map((script) => {
    const url = new URL(script.src);
    const { callback, ...params } = Object.fromEntries(url.searchParams);
    return { method: url.pathname.replace("/method/", ""), params };
  });
}

function respond(index: number, response: unknown) {
  const callback = new URL(scripts[index]!.src).searchParams.get("callback")!;
  Reflect.get(window, callback)(response);
}

function failDelivery(index: number) {
  scripts[index]!.onerror!();
}

describe("createVkApi", () => {
  beforeEach(() => {
    scripts = [];
    vi.useFakeTimers();
    vi.stubGlobal("window", globalThis);
    vi.stubGlobal("document", {
      createElement: () => new FakeScript(),
      head: { append: (script: FakeScript) => scripts.push(script) },
    });
    vi.spyOn(console, "log").mockImplementation(noop);
    vi.spyOn(console, "warn").mockImplementation(noop);
  });

  afterEach(() => {
    vi.unstubAllGlobals();
    vi.restoreAllMocks();
    vi.useRealTimers();
  });

  it("отправляет метод с токеном, версией API и языком", async () => {
    const api = createVkApi("token");

    const request = api.addRequestToQueue({
      method: "photos.get",
      params: { owner_id: -1, count: 150, private: true },
    });
    await vi.advanceTimersByTimeAsync(0);
    respond(0, { response: { count: 3 } });

    await expect(request).resolves.toEqual({ count: 3 });
    expect(sentRequests()).toEqual([
      {
        method: "photos.get",
        params: {
          access_token: "token",
          v: "5.131",
          lang: "ru",
          owner_id: "-1",
          count: "150",
          private: "true",
        },
      },
    ]);
  });

  it("выполняет не больше трёх запросов в секунду", async () => {
    const api = createVkApi("token");

    for (let i = 0; i < 4; i++) {
      api.addRequestToQueue({ method: "photos.get", params: {} });
    }

    await vi.advanceTimersByTimeAsync(0);
    expect(scripts).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(334);
    expect(scripts).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(334);
    expect(scripts).toHaveLength(3);
    await vi.advanceTimersByTimeAsync(334);
    expect(scripts).toHaveLength(4);
  });

  it("превращает ошибку VK в ошибку с errorInfo", async () => {
    const api = createVkApi("token");

    const request = api.addRequestToQueue({ method: "photos.get", params: {} });
    await vi.advanceTimersByTimeAsync(0);
    respond(0, {
      error: {
        error_code: 15,
        error_msg: "Access denied: id blocked",
        request_params: [],
      },
    });

    await expect(request).rejects.toMatchObject({
      message: "Access denied: id blocked",
      errorInfo: { error_code: 15, error_msg: "Access denied: id blocked" },
    });
  });

  it("сообщает о недоставленном запросе ошибкой доставки", async () => {
    const api = createVkApi("token");

    const request = api.addRequestToQueue({ method: "photos.get", params: {} });
    await vi.advanceTimersByTimeAsync(0);
    failDelivery(0);

    await expect(request).rejects.toBeInstanceOf(VkTransportError);
  });
});
