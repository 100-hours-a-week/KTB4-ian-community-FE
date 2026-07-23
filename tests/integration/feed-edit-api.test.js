import { beforeEach, describe, expect, it, vi } from "vitest";
import { postApi } from "../../src/entities/post/api/postApi.js";
import { resetHttpClientForTests } from "../../src/shared/api/httpClient.js";

describe("피드 수정 API 통합", () => {
  beforeEach(() => {
    resetHttpClientForTests();
    document.cookie = "XSRF-TOKEN=edit-test; Path=/";
    globalThis.__API_BASE_URL__ = "http://api.test";
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
  });

  it("Backend 계약에 맞춰 공통 Client로 PATCH JSON을 전송한다", async () => {
    await postApi.update(31, {
      content: "수정한 피드 본문",
      imageUrl: "/images/feed/existing.jpg",
    });

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe("http://api.test/api/posts/31");
    expect(options).toMatchObject({ method: "PATCH", credentials: "include" });
    expect(options.headers.get("X-XSRF-TOKEN")).toBe("edit-test");
    expect(options.headers.get("Content-Type")).toBe("application/json");
    expect(JSON.parse(options.body)).toEqual({
      title: "수정한 피드 본문",
      content: "수정한 피드 본문",
      imageUrl: "/images/feed/existing.jpg",
    });
  });
});
