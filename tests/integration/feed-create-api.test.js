import { beforeEach, describe, expect, it, vi } from "vitest";
import { postApi } from "../../src/entities/post/api/postApi.js";
import { resetHttpClientForTests } from "../../src/shared/api/httpClient.js";

describe("피드 생성 API 통합", () => {
  beforeEach(() => {
    resetHttpClientForTests();
    document.cookie = "XSRF-TOKEN=create-test; Path=/";
    globalThis.__API_BASE_URL__ = "http://api.test";
    globalThis.fetch = vi
      .fn()
      .mockResolvedValue(new Response(null, { status: 204 }));
  });

  it("API Adapter가 공통 Client로 본문과 선택 이미지 FormData를 전송한다", async () => {
    const image = new File(["image"], "feed.png", { type: "image/png" });
    await postApi.create(7, { content: "작성 본문", image });

    expect(fetch).toHaveBeenCalledTimes(1);
    const [url, options] = fetch.mock.calls[0];
    expect(url).toBe("http://api.test/api/posts/7");
    expect(options).toMatchObject({ method: "POST", credentials: "include" });
    expect(options.headers.get("X-XSRF-TOKEN")).toBe("create-test");
    expect(options.headers.has("Content-Type")).toBe(false);
    expect(options.body).toBeInstanceOf(FormData);
    expect(options.body.get("content")).toBe("작성 본문");
    expect(options.body.get("image")).toBe(image);
  });

  it("이미지가 없으면 image Field를 만들지 않는다", async () => {
    await postApi.create(7, { content: "본문만", image: null });
    const options = fetch.mock.calls[0][1];
    expect(options.body.get("content")).toBe("본문만");
    expect(options.body.has("image")).toBe(false);
  });
});
