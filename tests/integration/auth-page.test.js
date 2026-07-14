import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

describe("인증 페이지 통합", () => {
  it.each(["login", "signup"])("%s 페이지에 50/50 shell과 접근 가능한 폼이 있다", (page) => {
    document.documentElement.innerHTML = readFileSync(`pages/${page}/${page}.html`, "utf8");
    expect(document.querySelector(".auth-shell")).not.toBeNull(); expect(document.querySelector(".auth-artwork")).not.toBeNull();
    document.querySelectorAll("input").forEach((input) => expect(document.querySelector(`label[for="${input.id}"]`)).not.toBeNull());
  });
});
