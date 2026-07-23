import { expect, test } from "@playwright/test";

test("실제 Backend에서 비밀번호를 변경하고 새 비밀번호로 로그인한다", async ({
  page,
}) => {
  await page.addInitScript(() => {
    globalThis.__API_BASE_URL__ = "http://127.0.0.1:8081";
  });
  const suffix = `${Date.now()}`.slice(-9);
  const email = `password-${suffix}@example.com`;
  const nickname = `암호${suffix.slice(-4)}`;
  await page.goto("/signup");
  await page.getByLabel("이메일").fill(email);
  await page.getByLabel("비밀번호", { exact: true }).fill("Signup123!");
  await page.getByLabel("비밀번호 확인").fill("Signup123!");
  await page.getByLabel("닉네임").fill(nickname);
  await page.getByRole("button", { name: "회원가입", exact: true }).click();
  await expect(page).toHaveURL(/\/feed$/);

  await page
    .getByRole("button", { name: "비밀번호 변경", exact: true })
    .click();
  const dialog = page.getByRole("dialog", { name: "비밀번호 변경" });
  await dialog.getByLabel("현재 비밀번호").fill("Signup123!");
  await dialog.getByLabel("새 비밀번호", { exact: true }).fill("Changed123!");
  await dialog.getByLabel("새 비밀번호 확인").fill("Changed123!");
  const responsePromise = page.waitForResponse(
    (response) =>
      /\/api\/users\/\d+\/password$/.test(new URL(response.url()).pathname) &&
      response.request().method() === "PATCH",
  );
  await dialog.getByRole("button", { name: "변경하기" }).click();
  expect((await responsePromise).status()).toBe(204);
  await expect(dialog).toBeHidden();

  await page.getByRole("button", { name: "로그아웃", exact: true }).click();
  await page
    .getByRole("dialog", { name: "로그아웃 확인" })
    .getByRole("button", { name: "확인" })
    .click();
  await expect(page).toHaveURL(/\/login$/);
  await page.getByLabel("이메일").fill(email);
  await page.getByLabel("비밀번호").fill("Changed123!");
  await page.getByRole("button", { name: "로그인", exact: true }).click();
  await expect(page).toHaveURL(/\/feed$/);
  await expect(page.locator(".lnb-user")).toContainText(nickname);
});
