import { beforeEach, describe, expect, it, vi } from "vitest";
import { apiAssetUrl, defaultApiBaseUrl } from "../../src/shared/config/env.js";
import { userApi } from "../../src/entities/user/api/userApi.js";
import { resetHttpClientForTests } from "../../src/shared/api/httpClient.js";

describe("React shared HTTP 계약", () => {
  beforeEach(() => {
    resetHttpClientForTests();
    document.cookie = "XSRF-TOKEN=test; Path=/";
    globalThis.__API_BASE_URL__ = "http://api.test";
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
  });

  it("상대 이미지 URL을 Backend base URL과 결합한다", () => {
    expect(apiAssetUrl("/images/avatar.png")).toBe(
      "http://api.test/images/avatar.png",
    );
    expect(apiAssetUrl(null)).toBe(
      "http://api.test/images/profile-default.svg",
    );
  });

  it("운영 호스트에서는 Nginx same-origin API를 사용한다", () => {
    expect(defaultApiBaseUrl("community.example.com")).toBe("");
    expect(defaultApiBaseUrl("127.0.0.1")).toBe("http://127.0.0.1:8080");
  });

  it("회원탈퇴는 Backend의 /delete 경로와 공통 Client를 사용한다", async () => {
    await userApi.remove(7);
    expect(fetch).toHaveBeenCalledWith(
      "http://api.test/api/users/7/delete",
      expect.objectContaining({ method: "DELETE", credentials: "include" }),
    );
  });
});
