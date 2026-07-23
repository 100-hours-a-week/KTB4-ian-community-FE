import { expect, test } from "@playwright/test";

test("실제 Backend에서 생성한 피드를 삭제하고 새로고침 후 다시 조회한다", async ({
  page,
}) => {
  await page.addInitScript(() => {
    globalThis.__API_BASE_URL__ = "http://127.0.0.1:8081";
  });
  const suffix = `${Date.now()}`.slice(-9);
  const content = `실제 삭제 피드 ${suffix}`;
  await page.goto("/signup");
  await page.getByLabel("이메일").fill(`delete-${suffix}@example.com`);
  await page.getByLabel("비밀번호", { exact: true }).fill("Signup123!");
  await page.getByLabel("비밀번호 확인").fill("Signup123!");
  await page.getByLabel("닉네임").fill(`삭제${suffix.slice(-4)}`);
  await page.getByRole("button", { name: "회원가입", exact: true }).click();
  await expect(page).toHaveURL(/\/feed$/);
  await page.getByRole("button", { name: "피드 게시하기" }).click();
  await page.getByLabel("피드 본문").fill(content);
  await page.getByRole("button", { name: "피드 게시", exact: true }).click();
  const card = page.locator(".post-card").filter({ hasText: content });
  await expect(card).toBeVisible();
  await card.getByRole("button", { name: "피드 옵션" }).click();
  await page.getByRole("menuitem", { name: "삭제하기" }).click();
  const responsePromise = page.waitForResponse(
    (response) =>
      /\/api\/posts\/\d+$/.test(new URL(response.url()).pathname) &&
      response.request().method() === "DELETE",
  );
  await page
    .getByRole("dialog", { name: "피드 삭제 확인" })
    .getByRole("button", { name: "확인" })
    .click();
  expect((await responsePromise).status()).toBe(204);
  await expect(card).toHaveCount(0);
  await page.reload();
  await expect(page.getByText(content)).toHaveCount(0);
});
