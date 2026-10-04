import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { noop } from "es-toolkit";
import { VKError } from "vkontakte-api";
import {
  createJsonpSendRequest,
  VkTransportError,
} from "@/shared/services/createJsonpSendRequest";

class FakeScript {
  src = "";
  fetchPriority = "";
  onerror: (() => void) | null = null;
  remove = vi.fn();
}

let scripts: FakeScript[];

const sendRequest = createJsonpSendRequest({
  baseUrl: "https://api.vk.com",
  accessToken: "token",
  v: "5.131",
  lang: "ru",
  timeout: 1000,
});

function lastScript() {
  return scripts.at(-1)!;
}

function getCallbackName(script: FakeScript) {
  return new URL(script.src).searchParams.get("callback")!;
}

// Имитирует ответ сервера: JSONP-скрипт вызывает глобальный колбэк
function respond(response: unknown, script = lastScript()) {
  Reflect.get(window, getCallbackName(script))(response);
}

describe("createJsonpSendRequest", () => {
  beforeEach(() => {
    scripts = [];
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

  it("собирает адрес запроса с общими параметрами и высоким приоритетом", () => {
    sendRequest({
      method: "photos.get",
      params: { owner_id: -1, offset: 150, skip: undefined, fields: ["a", "b"] },
    });

    const url = new URL(lastScript().src);
    expect(url.origin + url.pathname).toBe("https://api.vk.com/method/photos.get");
    expect(Object.fromEntries(url.searchParams)).toEqual({
      v: "5.131",
      access_token: "token",
      lang: "ru",
      owner_id: "-1",
      offset: "150",
      fields: '["a","b"]',
      callback: getCallbackName(lastScript()),
    });
    expect(lastScript().fetchPriority).toBe("high");
  });

  it("возвращает поле response и применяет format", async () => {
    const request = sendRequest({
      method: "photos.get",
      params: {},
      format: (response: { count: number }) => response.count,
    });

    respond({ response: { count: 5 } });

    await expect(request).resolves.toBe(5);
    expect(lastScript().remove).toHaveBeenCalled();
    expect(Reflect.has(window, getCallbackName(lastScript()))).toBe(false);
  });

  it("превращает ошибку VK в VKError", async () => {
    const request = sendRequest({ method: "photos.get", params: {} });

    respond({
      error: { error_code: 15, error_msg: "Access denied", request_params: [] },
    });

    await expect(request).rejects.toBeInstanceOf(VKError);
  });

  it("отклоняет запрос, если скрипт не загрузился", async () => {
    const request = sendRequest({ method: "photos.get", params: {} });
    const script = lastScript();

    script.onerror!();

    await expect(request).rejects.toBeInstanceOf(VkTransportError);
    expect(script.remove).toHaveBeenCalled();
  });

  it("отклоняет зависший запрос по таймауту", async () => {
    vi.useFakeTimers();
    const request = sendRequest({ method: "photos.get", params: {} });
    const rejection = expect(request).rejects.toBeInstanceOf(VkTransportError);

    vi.advanceTimersByTime(1000);

    await rejection;
  });

  it("не падает, если ответ пришёл после таймаута", async () => {
    vi.useFakeTimers();
    const request = sendRequest({ method: "photos.get", params: {} });
    const script = lastScript();
    const rejection = expect(request).rejects.toBeInstanceOf(VkTransportError);
    vi.advanceTimersByTime(1000);
    await rejection;

    expect(() => respond({ response: 1 }, script)).not.toThrow();
  });

  it("не путает ответы параллельных запросов", async () => {
    const first = sendRequest({ method: "photos.get", params: {} });
    const firstScript = lastScript();
    const second = sendRequest({ method: "photos.get", params: {} });

    respond({ response: "второй" });
    respond({ response: "первый" }, firstScript);

    await expect(first).resolves.toBe("первый");
    await expect(second).resolves.toBe("второй");
  });
});
