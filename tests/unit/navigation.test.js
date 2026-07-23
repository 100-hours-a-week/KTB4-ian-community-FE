import { afterEach, describe, expect, it } from "vitest";
import { currentRoute, navigate } from "../../src/app/router/navigation.js";

describe("SPA navigation", () => {
  afterEach(() => history.replaceState({}, "", "/"));

  it("Live Server의 index.html을 로그인 진입점으로 해석한다", () => {
    history.replaceState({}, "", "/index.html");

    expect(currentRoute()).toEqual({ name: "login" });
  });

  it("Live Server에서는 새로고침 가능한 hash 경로를 사용한다", () => {
    history.replaceState({}, "", "/index.html");

    navigate("/feed");

    expect(location.pathname).toBe("/index.html");
    expect(location.hash).toBe("#/feed");
    expect(currentRoute()).toEqual({ name: "feed" });
  });

  it("Webpack 개발 서버 경로는 기존 History API 방식을 유지한다", () => {
    history.replaceState({}, "", "/");

    navigate("/posts/15");

    expect(location.pathname).toBe("/posts/15");
    expect(location.hash).toBe("");
    expect(currentRoute()).toEqual({ name: "post", postId: "15" });
  });

  it("회원가입 Route를 해석한다", () => {
    history.replaceState({}, "", "/signup");

    expect(currentRoute()).toEqual({ name: "signup" });
  });

  it("로그인 직접 접근 Route를 해석한다", () => {
    history.replaceState({}, "", "/login");

    expect(currentRoute()).toEqual({ name: "login" });
  });
});
