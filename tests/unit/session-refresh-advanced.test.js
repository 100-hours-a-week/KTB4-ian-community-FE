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
    resetHttpClientForTests();
    document.cookie = "XSRF-TOKEN=token; Path=/";
    globalThis.__API_BASE_URL__ = "http://api.test";
    globalThis.fetch = vi.fn();
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
        return new Response(null, { status: 204 });
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

  it("만료 45초 전에 Timer로 선제 Refresh한다", async () => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2026-07-29T00:00:00Z"));
    fetch.mockResolvedValue(
      json(200, {
        accessTokenExpiresAt: "2026-07-29T01:00:00Z",
      }),
    );
    setAccessTokenExpiresAt("2026-07-29T00:00:50Z");

    await vi.advanceTimersByTimeAsync(5_000);

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
});
