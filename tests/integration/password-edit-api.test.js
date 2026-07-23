import { beforeEach, describe, expect, it, vi } from "vitest";
import { userApi } from "../../src/entities/user/api/userApi.js";
import { resetHttpClientForTests } from "../../src/shared/api/httpClient.js";

describe("비밀번호 변경 API 통합", () => {
  beforeEach(() => {
    resetHttpClientForTests();
    document.cookie = "XSRF-TOKEN=password-test; Path=/";
    globalThis.__API_BASE_URL__ = "http://api.test";
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
  });

  it("Backend 필드 계약으로 공통 Client PATCH를 전송한다", async () => {
    const payload = {
      password: "Signup123!",
      newPassword: "Changed123!",
      password_confirm: "Changed123!",
    };
    await userApi.updatePassword(7, payload);
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe("http://api.test/api/users/7/password");
    expect(options).toMatchObject({ method: "PATCH", credentials: "include" });
    expect(JSON.parse(options.body)).toEqual(payload);
  });
});
