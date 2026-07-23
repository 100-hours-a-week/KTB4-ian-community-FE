import { beforeEach, describe, expect, it, vi } from "vitest";
import { postApi } from "../../src/entities/post/api/postApi.js";
import { resetHttpClientForTests } from "../../src/shared/api/httpClient.js";

describe("피드 삭제 API 통합", () => {
  beforeEach(() => {
    resetHttpClientForTests();
    document.cookie = "XSRF-TOKEN=delete-test; Path=/";
    globalThis.__API_BASE_URL__ = "http://api.test";
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
  });

  it("공통 Client로 Backend 피드 DELETE Endpoint를 호출한다", async () => {
    await postApi.remove(31);
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe("http://api.test/api/posts/31");
    expect(options).toMatchObject({ method: "DELETE", credentials: "include" });
    expect(options.headers.get("X-XSRF-TOKEN")).toBe("delete-test");
  });
});
