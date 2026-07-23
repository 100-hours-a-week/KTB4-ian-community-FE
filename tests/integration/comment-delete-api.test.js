import { beforeEach, describe, expect, it, vi } from "vitest";
import { postApi } from "../../src/entities/post/api/postApi.js";
import { resetHttpClientForTests } from "../../src/shared/api/httpClient.js";

describe("댓글 삭제 API 통합", () => {
  beforeEach(() => {
    resetHttpClientForTests();
    document.cookie = "XSRF-TOKEN=comment-delete; Path=/";
    globalThis.__API_BASE_URL__ = "http://api.test";
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
  });
  it("공통 Client로 Backend 댓글 DELETE Endpoint를 호출한다", async () => {
    await postApi.removeComment(31, 41, 7);
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe("http://api.test/api/posts/31/comments/41/users/7");
    expect(options).toMatchObject({ method: "DELETE", credentials: "include" });
    expect(options.headers.get("X-XSRF-TOKEN")).toBe("comment-delete");
  });
});
