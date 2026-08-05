import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import {
  clearAccessTokenRefresh,
  httpClient,
  resetHttpClientForTests,
  setAccessTokenExpiresAt,
} from "../../src/shared/api/httpClient.js";

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

describe("자동·선제 Refresh", () => {
  beforeEach(() => {
    sessionStorage.clear();
    localStorage.clear();
    resetHttpClientForTests();
    document.cookie = "XSRF-TOKEN=token; Path=/";
    globalThis.__API_BASE_URL__ = "http://api.test";
    globalThis.fetch = vi.fn();
    Object.defineProperty(navigator, "locks", {
      configurable: true,
      value: undefined,
    });
  });

  afterEach(() => {
    clearAccessTokenRefresh();
    vi.useRealTimers();
  });

  it("Backend 대문자 만료 Code에서 원 요청을 최대 한 번 재시도한다", async () => {
    let posts = 0;
    fetch.mockImplementation(async (url) => {
      const path = new URL(url).pathname;
      if (path === "/api/users/refresh")
        return json(200, {
          accessTokenExpiresAt: new Date(Date.now() + 600_000).toISOString(),
        });
      posts += 1;
      return json(401, {
        code: "EXPIRED_ACCESS_TOKEN",
        message: "Access Token이 만료되었습니다.",
      });
    });

    await expect(httpClient("/api/posts")).rejects.toMatchObject({
      code: "EXPIRED_ACCESS_TOKEN",
    });
    expect(posts).toBe(2);
    expect(
      fetch.mock.calls.filter(
        ([url]) => new URL(url).pathname === "/api/users/refresh",
      ),
    ).toHaveLength(1);
  });

  it("Refresh 실패 시 인증 저장소를 지우고 로그인으로 이동한다", async () => {
    sessionStorage.setItem("community.user", "{}");
    sessionStorage.setItem("userId", "1");
    history.replaceState({}, "", "/feed");
    fetch.mockImplementation(async (url) => {
      if (new URL(url).pathname === "/api/users/refresh")
        return json(401, {
          code: "INVALID_REFRESH_TOKEN",
          message: "invalid",
        });
      return json(401, {
        code: "EXPIRED_ACCESS_TOKEN",
        message: "expired",
      });
    });

    await expect(httpClient("/api/posts")).rejects.toMatchObject({
      code: "INVALID_REFRESH_TOKEN",
    });
    expect(sessionStorage.getItem("community.user")).toBeNull();
    expect(location.pathname).toBe("/login");
  });

  it("발급 9분 시점인 만료 60초 전에 Timer로 선제 Refresh한다", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-29T00:00:00Z"));
    fetch.mockResolvedValue(
      json(200, {
        accessTokenExpiresAt: "2026-07-29T00:20:00Z",
      }),
    );
    setAccessTokenExpiresAt("2026-07-29T00:10:00Z");

    await vi.advanceTimersByTimeAsync(8 * 60_000 + 59_000);
    expect(fetch).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(1_000);

    expect(fetch).toHaveBeenCalledTimes(1);
    expect(new URL(fetch.mock.calls[0][0]).pathname).toBe("/api/users/refresh");
  });

  it("탭 복귀 시 만료 임박 여부를 다시 검사한다", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-29T00:00:00Z"));
    fetch.mockResolvedValue(
      json(200, {
        accessTokenExpiresAt: "2026-07-29T01:00:00Z",
      }),
    );
    Object.defineProperty(document, "visibilityState", {
      configurable: true,
      value: "visible",
    });
    setAccessTokenExpiresAt("2026-07-29T00:00:40Z");

    document.dispatchEvent(new Event("visibilitychange"));
    await vi.waitFor(() => expect(fetch).toHaveBeenCalledTimes(1));
  });

  it("Logout 상태 정리는 예약된 Timer를 제거한다", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-29T00:00:00Z"));
    fetch.mockResolvedValue(new Response(null, { status: 204 }));
    setAccessTokenExpiresAt("2026-07-29T00:00:50Z");
    clearAccessTokenRefresh();

    await vi.advanceTimersByTimeAsync(10_000);
    expect(fetch).not.toHaveBeenCalled();
  });

  it.each([
    "REFRESH_TOKEN_NOT_FOUND",
    "INVALID_REFRESH_TOKEN",
    "EXPIRED_REFRESH_TOKEN",
    "REFRESH_TOKEN_REUSED",
    "REFRESH_TOKEN_USER_MISMATCH",
    "REFRESH_TOKEN_FAMILY_MISMATCH",
    "USER_NOT_FOUND",
    "USER_ALREADY_DELETED",
  ])("선제 Refresh의 %s Code는 즉시 세션을 종료한다", async (code) => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-29T00:00:00Z"));
    sessionStorage.setItem("community.user", "{}");
    sessionStorage.setItem("userId", "1");
    history.replaceState({}, "", "/feed");
    fetch.mockResolvedValue(json(401, { code, message: "refresh failed" }));
    setAccessTokenExpiresAt("2026-07-29T00:01:00Z");

    await expect(httpClient("/api/posts")).rejects.toMatchObject({ code });

    expect(sessionStorage.getItem("community.user")).toBeNull();
    expect(location.pathname).toBe("/login");
    expect(fetch).toHaveBeenCalledTimes(1);
  });

  it("일시 오류는 요청만 중단하고 10초 뒤 한 번 자동 재시도한다", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-29T00:00:00Z"));
    sessionStorage.setItem("community.user", "{}");
    sessionStorage.setItem("userId", "1");
    history.replaceState({}, "", "/feed");
    let refreshCalls = 0;
    fetch.mockImplementation(async (url) => {
      const path = new URL(url).pathname;
      if (path !== "/api/users/refresh")
        return json(200, { data: { ok: true } });
      refreshCalls += 1;
      if (refreshCalls === 1)
        return json(500, {
          code: "INTERNAL_SERVER_ERROR",
          message: "temporary",
        });
      return json(200, {
        accessTokenExpiresAt: "2026-07-29T00:20:10Z",
      });
    });
    setAccessTokenExpiresAt("2026-07-29T00:01:00Z");

    await expect(httpClient("/api/posts")).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
    expect(sessionStorage.getItem("community.user")).toBe("{}");
    expect(location.pathname).toBe("/feed");
    expect(refreshCalls).toBe(1);

    await vi.advanceTimersByTimeAsync(9_999);
    expect(refreshCalls).toBe(1);
    await vi.advanceTimersByTimeAsync(1);
    expect(refreshCalls).toBe(2);
    expect(localStorage.getItem("community.accessTokenExpiresAt")).toBe(
      "2026-07-29T00:20:10Z",
    );
  });

  it("10초 뒤 재시도도 실패하면 다음 외부 Trigger까지 반복하지 않는다", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-29T00:00:00Z"));
    sessionStorage.setItem("community.user", "{}");
    sessionStorage.setItem("userId", "1");
    fetch.mockResolvedValue(
      json(500, {
        code: "INTERNAL_SERVER_ERROR",
        message: "temporary",
      }),
    );
    setAccessTokenExpiresAt("2026-07-29T00:01:00Z");

    await expect(httpClient("/api/posts")).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
    await vi.advanceTimersByTimeAsync(10_000);
    await vi.advanceTimersByTimeAsync(60_000);

    expect(fetch).toHaveBeenCalledTimes(2);
    expect(sessionStorage.getItem("community.user")).toBe("{}");
  });

  it("Web Lock 대기 중 다른 탭이 갱신했으면 Refresh 호출을 생략한다", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-29T00:00:00Z"));
    sessionStorage.setItem("community.user", "{}");
    sessionStorage.setItem("userId", "1");
    const locks = {
      request: vi.fn(async (_name, _options, callback) => {
        localStorage.setItem(
          "community.accessTokenExpiresAt",
          "2026-07-29T00:20:00Z",
        );
        return callback();
      }),
    };
    Object.defineProperty(navigator, "locks", {
      configurable: true,
      value: locks,
    });
    fetch.mockResolvedValue(json(200, { data: { ok: true } }));
    setAccessTokenExpiresAt("2026-07-29T00:01:00Z");

    await expect(httpClient("/api/posts")).resolves.toEqual({ ok: true });

    expect(locks.request).toHaveBeenCalledTimes(1);
    expect(fetch).toHaveBeenCalledTimes(1);
    expect(new URL(fetch.mock.calls[0][0]).pathname).toBe("/api/posts");
  });

  it("Web Lock 대기 중 다른 탭이 세션을 종료했으면 Refresh를 호출하지 않는다", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-29T00:00:00Z"));
    sessionStorage.setItem("community.user", "{}");
    sessionStorage.setItem("userId", "1");
    history.replaceState({}, "", "/feed");
    let acquireLock;
    Object.defineProperty(navigator, "locks", {
      configurable: true,
      value: {
        request: vi.fn(
          (_name, _options, callback) =>
            new Promise((resolve, reject) => {
              acquireLock = () => callback().then(resolve, reject);
            }),
        ),
      },
    });
    setAccessTokenExpiresAt("2026-07-29T00:01:00Z");

    const request = httpClient("/api/posts");
    await vi.waitFor(() => expect(acquireLock).toBeTypeOf("function"));
    dispatchEvent(
      new StorageEvent("storage", {
        key: "community.authEvent",
        newValue: JSON.stringify({ type: "session-expired" }),
      }),
    );
    acquireLock();

    await expect(request).rejects.toMatchObject({ code: "SESSION_NOT_ACTIVE" });
    expect(fetch).not.toHaveBeenCalled();
    expect(location.pathname).toBe("/login");
  });

  it("다른 탭의 만료 시각과 세션 종료 Event를 현재 탭에 반영한다", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-29T00:00:00Z"));
    sessionStorage.setItem("community.user", "{}");
    sessionStorage.setItem("userId", "1");
    history.replaceState({}, "", "/feed");
    fetch.mockResolvedValue(json(200, { data: { ok: true } }));

    dispatchEvent(
      new StorageEvent("storage", {
        key: "community.accessTokenExpiresAt",
        newValue: "2026-07-29T00:20:00Z",
      }),
    );
    await expect(httpClient("/api/posts")).resolves.toEqual({ ok: true });

    dispatchEvent(
      new StorageEvent("storage", {
        key: "community.authEvent",
        newValue: JSON.stringify({ type: "session-expired" }),
      }),
    );

    expect(sessionStorage.getItem("community.user")).toBeNull();
    expect(location.pathname).toBe("/login");
  });
});
