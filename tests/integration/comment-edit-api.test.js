import { beforeEach, describe, expect, it, vi } from "vitest";
import { postApi } from "../../src/entities/post/api/postApi.js";
import { resetHttpClientForTests } from "../../src/shared/api/httpClient.js";

describe("댓글 수정 API 통합", () => {
  beforeEach(() => {
    resetHttpClientForTests();
    document.cookie = "XSRF-TOKEN=comment-edit-test; Path=/";
    globalThis.__API_BASE_URL__ = "http://api.test";
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
  });

  it("Backend 경로와 JSON 계약으로 공통 Client를 사용한다", async () => {
    await postApi.updateComment(31, 41, 7, "수정 댓글");
    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe("http://api.test/api/posts/31/comments/41/users/7");
    expect(options).toMatchObject({ method: "PATCH", credentials: "include" });
    expect(options.headers.get("X-XSRF-TOKEN")).toBe("comment-edit-test");
    expect(JSON.parse(options.body)).toEqual({ comment: "수정 댓글" });
  });
});
