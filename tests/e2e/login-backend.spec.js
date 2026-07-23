import { expect, test } from "@playwright/test";

test("실제 Backend 로그인 실패 후 성공하고 현재 사용자를 표시한다", async ({
  page,
}) => {
  await page.addInitScript(() => {
    globalThis.__API_BASE_URL__ = "http://127.0.0.1:8081";
  });
  const suffix = `${Date.now()}`.slice(-9);
  const email = `login-${suffix}@example.com`;
  const password = "Signup123!";
  const nickname = `로그${suffix.slice(-4)}`;

  await page.goto("/signup");
  await page.getByLabel("이메일").fill(email);
  await page.getByLabel("비밀번호", { exact: true }).fill(password);
  await page.getByLabel("비밀번호 확인").fill(password);
  await page.getByLabel("닉네임").fill(nickname);
  await page.getByRole("button", { name: "회원가입", exact: true }).click();
  await expect(page).toHaveURL(/\/feed$/);

  await page.getByRole("button", { name: "로그아웃", exact: true }).click();
  await page
    .getByRole("dialog", { name: "로그아웃 확인" })
    .getByRole("button", { name: "확인" })
    .click();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("이메일").fill(email);
  await page.getByLabel("비밀번호").fill("Wrong123!");
  const failedResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/users/login" &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  expect((await failedResponse).status()).toBe(400);
  await expect(page.getByRole("alert")).toBeVisible();
  await expect(page).toHaveURL(/\/login$/);

  await page.getByLabel("비밀번호").fill(password);
  const successResponse = page.waitForResponse(
    (response) =>
      new URL(response.url()).pathname === "/api/users/login" &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  expect((await successResponse).status()).toBe(200);
  await expect(page).toHaveURL(/\/feed$/);
  await expect(
    page.locator(".lnb-user").getByAltText(`${nickname} 프로필`),
  ).toBeVisible();
});
