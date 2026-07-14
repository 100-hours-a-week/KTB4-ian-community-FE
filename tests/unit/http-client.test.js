import { beforeEach, describe, expect, it, vi } from "vitest";
import { __resetHttpClientForTests, apiRequest } from "../../scripts/api/http-client.js";

const response = (status, body = null) => new Response(body && JSON.stringify(body), { status, headers: body ? { "content-type": "application/json" } : {} });
describe("apiRequest token refresh", () => {
  beforeEach(() => { __resetHttpClientForTests(); document.cookie = "XSRF-TOKEN=test"; global.fetch = vi.fn(); });
  it("동시 만료 요청에서 refresh를 한 번만 호출하고 원 요청을 한 번 재시도한다", async () => {
    const calls = new Map();
    fetch.mockImplementation(async (url) => {
      const path = new URL(url).pathname; calls.set(path, (calls.get(path) || 0) + 1);
      if (path === "/api/users/refresh") return response(204);
      if (calls.get(path) === 1) return response(401, { message: "expired_access_token" });
      return response(200, { data: { ok: true } });
    });
    const result = await Promise.all([apiRequest("/api/posts"), apiRequest("/api/users/1")]);
    expect(result).toEqual([{ ok: true }, { ok: true }]); expect(calls.get("/api/users/refresh")).toBe(1);
    expect(calls.get("/api/posts")).toBe(2); expect(calls.get("/api/users/1")).toBe(2);
  });
  it("일반 401과 코드 필드만 있는 401은 refresh하지 않는다", async () => {
    fetch.mockResolvedValue(response(401, { code: "expired_access_token", message: "unauthorized" }));
    await expect(apiRequest("/api/posts")).rejects.toMatchObject({ status: 401 });
    expect(fetch).toHaveBeenCalledOnce();
  });
  it("재시도도 만료되면 두 번째 refresh 없이 세션을 정리한다", async () => {
    sessionStorage.setItem("userId", "1"); let refreshCount = 0;
    fetch.mockImplementation(async (url) => { if (new URL(url).pathname === "/api/users/refresh") { refreshCount += 1; return response(204); } return response(401, { message: "expired_access_token" }); });
    await expect(apiRequest("/api/posts")).rejects.toMatchObject({ status: 401 });
    expect(refreshCount).toBe(1); expect(sessionStorage.getItem("userId")).toBeNull();
  });
  it("refresh 실패 시 세션을 정리한다", async () => {
    sessionStorage.setItem("userId", "2"); fetch.mockImplementation(async (url) => new URL(url).pathname === "/api/users/refresh" ? response(401, { message: "expired_refresh_token" }) : response(401, { message: "expired_access_token" }));
    await expect(apiRequest("/api/posts")).rejects.toThrow("세션을 갱신하지 못했습니다."); expect(sessionStorage.getItem("userId")).toBeNull();
  });
});
