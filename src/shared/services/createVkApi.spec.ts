import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { noop } from "es-toolkit";
import { createVkApi } from "@/shared/services/createVkApi";
import { VkApiError, VkTransportError } from "@/shared/services/vkApiErrors";

const { send } = vi.hoisted(() => ({ send: vi.fn() }));

vi.mock("@vkontakte/vk-bridge", () => ({ default: { send } }));

// Способ доставки запроса скрыт за этими помощниками: тесты ниже описывают поведение клиента

let pending: {
  resolve: (value: unknown) => void;
  reject: (reason: unknown) => void;
}[];

function sentRequests() {
  return send.mock.calls.map(([, props]) => props);
}

// Имитирует ответ сервера: тело ответа VK API ({ response } или { error })
function respond(index: number, body: { response?: unknown; error?: unknown }) {
  if ("error" in body) {
    // Клиент VK отдаёт ошибку API внутри error_reason
    pending[index]!.reject({
      error_type: "client_error",
      error_data: { error_code: 1, error_reason: body.error },
    });
    return;
  }

  pending[index]!.resolve(body);
}

function failDelivery(index: number) {
  pending[index]!.reject({
    error_type: "client_error",
    error_data: { error_code: 3, error_reason: "Connection lost" },
  });
}

describe("createVkApi", () => {
  beforeEach(() => {
    pending = [];
    vi.useFakeTimers();
    send.mockReset().mockImplementation(
      () => new Promise((resolve, reject) => pending.push({ resolve, reject })),
    );
    vi.spyOn(console, "log").mockImplementation(noop);
    vi.spyOn(console, "warn").mockImplementation(noop);
  });

  afterEach(() => {
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
    expect(sentRequests()).toHaveLength(1);
    await vi.advanceTimersByTimeAsync(334);
    expect(sentRequests()).toHaveLength(2);
    await vi.advanceTimersByTimeAsync(334);
    expect(sentRequests()).toHaveLength(3);
    await vi.advanceTimersByTimeAsync(334);
    expect(sentRequests()).toHaveLength(4);
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

  describe("форматы ошибок vk-bridge", () => {
    async function rejectWith(error: unknown) {
      const api = createVkApi("token");
      const request = api.addRequestToQueue({ method: "photos.get", params: {} });
      await vi.advanceTimersByTimeAsync(0);
      pending[0]!.reject(error);
      return request.catch((ex: unknown) => ex);
    }

    it("распознаёт ошибку API в error_data", async () => {
      const error = await rejectWith({
        error_type: "api_error",
        error_data: { error_code: 6, error_msg: "Too many", request_params: [] },
      });

      expect(error).toBeInstanceOf(VkApiError);
      expect(error).toMatchObject({ errorInfo: { error_code: 6 } });
    });

    it("считает ошибкой доставки отказ без данных об ошибке API", async () => {
      const error = await rejectWith({
        error_type: "auth_error",
        error_data: { error_code: 4, error_reason: "User denied" },
      });

      expect(error).toBeInstanceOf(VkTransportError);
    });

    it("считает ошибкой доставки исключение самого vk-bridge", async () => {
      const error = await rejectWith(new Error("Bridge is not initialized"));

      expect(error).toBeInstanceOf(VkTransportError);
      expect(error).toMatchObject({ message: "Bridge is not initialized" });
    });
  });
});
