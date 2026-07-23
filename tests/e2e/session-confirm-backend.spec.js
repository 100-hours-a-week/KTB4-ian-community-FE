import { expect, test } from "@playwright/test";

async function signup(page, prefix) {
  await page.addInitScript(() => {
    globalThis.__API_BASE_URL__ = "http://127.0.0.1:8081";
  });
  const suffix = `${Date.now()}-${prefix}`;
  await page.goto("/signup");
  await page.getByLabel("이메일").fill(`${suffix}@example.com`);
  await page.getByLabel("비밀번호", { exact: true }).fill("Signup123!");
  await page.getByLabel("비밀번호 확인").fill("Signup123!");
  await page.getByLabel("닉네임").fill(`${prefix}${`${Date.now()}`.slice(-4)}`);
  await page.getByRole("button", { name: "회원가입", exact: true }).click();
  await expect(page).toHaveURL(/\/feed$/);
}

test("실제 Backend 로그아웃은 한 번 호출하고 인증을 정리한다", async ({
  page,
}) => {
  await signup(page, "로그");
  await page.getByRole("button", { name: "로그아웃", exact: true }).click();
  const responsePromise = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/users/logout") &&
      response.request().method() === "POST",
  );
  await page
    .getByRole("dialog", { name: "로그아웃 확인" })
    .getByRole("button", { name: "확인" })
    .click();
  expect((await responsePromise).status()).toBe(204);
  await expect(page).toHaveURL(/\/login$/);
  expect(
    await page.evaluate(() => sessionStorage.getItem("community.user")),
  ).toBeNull();
});

test("실제 Backend 회원탈퇴 Endpoint 성공 후 인증을 정리한다", async ({
  page,
}) => {
  await signup(page, "탈퇴");
  await page
    .locator(".lnb")
    .getByRole("button", { name: "프로필 편집", exact: true })
    .click();
  await page
    .getByRole("dialog", { name: "프로필 편집" })
    .getByRole("button", { name: "회원탈퇴", exact: true })
    .click();
  const responsePromise = page.waitForResponse(
    (response) =>
      /\/api\/users\/\d+\/delete$/.test(new URL(response.url()).pathname) &&
      response.request().method() === "DELETE",
  );
  await page
    .getByRole("dialog", { name: "회원탈퇴 확인" })
    .getByRole("button", { name: "확인" })
    .click();
  expect((await responsePromise).status()).toBe(204);
  await expect(page).toHaveURL(/\/login$/);
  expect(
    await page.evaluate(() => sessionStorage.getItem("community.user")),
  ).toBeNull();
});
