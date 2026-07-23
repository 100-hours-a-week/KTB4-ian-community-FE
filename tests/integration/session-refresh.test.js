import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  httpClient,
  resetHttpClientForTests,
} from "../../src/shared/api/httpClient.js";

const json = (status, body) =>
  new Response(JSON.stringify(body), {
    status,
    headers: { "content-type": "application/json" },
  });

describe("React 페이지 세션 자동 복구", () => {
  beforeEach(() => {
    resetHttpClientForTests();
    document.cookie = "XSRF-TOKEN=token; Path=/";
    globalThis.__API_BASE_URL__ = "http://api.test";
    globalThis.fetch = vi.fn();
  });

  it("method/body/query/header를 보존해 한 번 재시도한다", async () => {
    let posts = 0;
    fetch.mockImplementation(async (url, options) => {
      if (new URL(url).pathname === "/api/users/refresh")
        return new Response(null, { status: 204 });
      posts += 1;
      if (posts === 1) return json(401, { message: "expired_access_token" });
      expect(url).toContain("draft=true");
      expect(options.method).toBe("POST");
      expect(options.body).toBe('{"content":"hello"}');
      expect(options.headers.get("X-Custom")).toBe("yes");
      return json(200, { data: { postId: 1 } });
    });

    await expect(
      httpClient("/api/posts/1?draft=true", {
        method: "POST",
        body: '{"content":"hello"}',
        headers: { "X-Custom": "yes" },
      }),
    ).resolves.toEqual({ postId: 1 });
    expect(posts).toBe(2);
  });
});
