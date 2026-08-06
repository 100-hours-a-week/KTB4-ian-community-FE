import { expect, test } from "./fixtures.js";

test("실제 Backend 회원가입은 HttpOnly Cookie 인증 후 현재 사용자를 표시한다", async ({
  page,
  context,
}) => {
  const suffix = `${Date.now()}`.slice(-9);
  const email = `e2e-${suffix}@example.com`;
  const nickname = `실사용${suffix.slice(-4)}`;
  const consoleErrors = [];
  const failedResponses = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("response", (response) => {
    if (response.status() >= 400)
      failedResponses.push(`${response.status()} ${response.url()}`);
  });

  await page.goto("/signup");
  await page.getByLabel("이메일").fill(email);
  await page.getByLabel("비밀번호", { exact: true }).fill("Signup123!");
  await page.getByLabel("비밀번호 확인").fill("Signup123!");
  await page.getByLabel("닉네임").fill(nickname);

  const signupResponse = page.waitForResponse(
    (response) =>
      response.url().endsWith("/api/users/signup") &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "회원가입", exact: true }).click();
  expect((await signupResponse).status()).toBe(200);
  await expect(page).toHaveURL(/\/feed$/);
  await expect(
    page.locator(".lnb-user").getByAltText(`${nickname} 프로필`),
  ).toBeVisible();

  const cookieUrl = new URL(
    "/api/users",
    process.env.E2E_API_BASE_URL ?? "http://127.0.0.1:8081",
  );
  const cookies = await context.cookies(cookieUrl.toString());
  const accessCookie = cookies.find((cookie) => cookie.name === "accessToken");
  const refreshCookie = cookies.find(
    (cookie) => cookie.name === "refreshToken",
  );
  expect(accessCookie).toMatchObject({ httpOnly: true });
  expect(refreshCookie).toMatchObject({ httpOnly: true });
  const browserStorage = await page.evaluate(() =>
    Object.fromEntries(Object.entries(localStorage)),
  );
  expect(browserStorage).not.toHaveProperty("accessToken");
  expect(browserStorage).not.toHaveProperty("refreshToken");
  expect(Object.values(browserStorage)).not.toContain(accessCookie.value);
  expect(Object.values(browserStorage)).not.toContain(refreshCookie.value);
  expect(consoleErrors).toEqual([]);
  expect(failedResponses).toEqual([]);
});
