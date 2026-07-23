import { beforeEach, describe, expect, it, vi } from "vitest";
import { userApi } from "../../src/entities/user/api/userApi.js";
import { resetHttpClientForTests } from "../../src/shared/api/httpClient.js";

describe("프로필 편집 API 통합", () => {
  beforeEach(() => {
    resetHttpClientForTests();
    document.cookie = "XSRF-TOKEN=profile-edit-test; Path=/";
    globalThis.__API_BASE_URL__ = "http://api.test";
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
  });

  it("닉네임을 공통 Client의 PATCH JSON으로 전송한다", async () => {
    await userApi.updateNickname(7, "새닉네임");
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe("http://api.test/api/users/7/nickname");
    expect(options).toMatchObject({ method: "PATCH", credentials: "include" });
    expect(JSON.parse(options.body)).toEqual({ nickname: "새닉네임" });
  });

  it("프로필 이미지를 공통 Client의 multipart PATCH로 전송한다", async () => {
    const image = new File(["image"], "profile.png", { type: "image/png" });
    await userApi.updateProfileImage(7, image);
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe("http://api.test/api/users/7/profile-image");
    expect(options).toMatchObject({ method: "PATCH", credentials: "include" });
    expect(options.headers.has("Content-Type")).toBe(false);
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.body.get("image")).toBe(image);
  });
});
