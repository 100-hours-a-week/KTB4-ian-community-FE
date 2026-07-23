import { expect, test } from "@playwright/test";

test("실제 Backend에서 피드 본문을 수정하고 새로고침 후 다시 조회한다", async ({
  page,
}) => {
  await page.addInitScript(() => {
    globalThis.__API_BASE_URL__ = "http://127.0.0.1:8081";
  });
  const suffix = `${Date.now()}`.slice(-9);
  const nickname = `수정${suffix.slice(-4)}`;
  const initialContent = `수정 전 실제 피드 ${suffix}`;
  const updatedContent = `수정 후 실제 피드 ${suffix}`;
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/signup");
  await page.getByLabel("이메일").fill(`edit-${suffix}@example.com`);
  await page.getByLabel("비밀번호", { exact: true }).fill("Signup123!");
  await page.getByLabel("비밀번호 확인").fill("Signup123!");
  await page.getByLabel("닉네임").fill(nickname);
  await page.getByRole("button", { name: "회원가입", exact: true }).click();
  await expect(page).toHaveURL(/\/feed$/);

  await page.getByRole("button", { name: "피드 게시하기" }).click();
  await page.getByLabel("피드 본문").fill(initialContent);
  await page.getByRole("button", { name: "피드 게시", exact: true }).click();
  const createdCard = page
    .locator(".post-card")
    .filter({ hasText: initialContent });
  await expect(createdCard).toBeVisible();
  await createdCard.getByRole("button", { name: "피드 옵션" }).click();
  await page.getByRole("menuitem", { name: "수정하기" }).click();

  const dialog = page.getByRole("dialog", { name: "피드 편집" });
  await dialog.getByLabel("피드 본문").fill(updatedContent);
  const responsePromise = page.waitForResponse(
    (response) =>
      /\/api\/posts\/\d+$/.test(new URL(response.url()).pathname) &&
      response.request().method() === "PATCH",
  );
  await dialog.getByRole("button", { name: "피드 수정" }).click();
  expect((await responsePromise).status()).toBe(204);
  await expect(page.getByText(updatedContent)).toBeVisible();
  await expect(page.getByText(initialContent)).toHaveCount(0);

  await page.reload();
  await expect(page.getByText(updatedContent)).toBeVisible();
  await expect(page.getByText(initialContent)).toHaveCount(0);
  expect(consoleErrors).toEqual([]);
});
