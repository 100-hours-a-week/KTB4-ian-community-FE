import { expect, test } from "@playwright/test";

test("실제 Backend에서 댓글을 수정하고 새로고침 후 다시 조회한다", async ({
  page,
}) => {
  await page.addInitScript(() => {
    globalThis.__API_BASE_URL__ = "http://127.0.0.1:8081";
  });
  const suffix = `${Date.now()}`.slice(-9);
  const nickname = `댓글${suffix.slice(-4)}`;
  const postContent = `댓글 수정용 피드 ${suffix}`;
  const initialComment = `수정 전 댓글 ${suffix}`;
  const updatedComment = `수정 후 댓글 ${suffix}`;
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/signup");
  await page.getByLabel("이메일").fill(`comment-${suffix}@example.com`);
  await page.getByLabel("비밀번호", { exact: true }).fill("Signup123!");
  await page.getByLabel("비밀번호 확인").fill("Signup123!");
  await page.getByLabel("닉네임").fill(nickname);
  await page.getByRole("button", { name: "회원가입", exact: true }).click();
  await expect(page).toHaveURL(/\/feed$/);

  await page.getByRole("button", { name: "피드 게시하기" }).click();
  await page.getByLabel("피드 본문").fill(postContent);
  await page.getByRole("button", { name: "피드 게시", exact: true }).click();
  const createdCard = page
    .locator(".post-card")
    .filter({ hasText: postContent });
  await expect(createdCard).toBeVisible();
  await createdCard.locator(".post-card__body").click();
  await expect(page).toHaveURL(/\/posts\/\d+$/);

  await page.getByLabel("댓글 작성").fill(initialComment);
  await page.getByRole("button", { name: "댓글 등록" }).click();
  await expect(page.getByText(initialComment)).toBeVisible();
  await page.getByRole("button", { name: "댓글 옵션", exact: true }).click();
  await page.getByRole("menuitem", { name: "수정하기", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "댓글" });
  await dialog.getByLabel("댓글 내용").fill(updatedComment);
  const responsePromise = page.waitForResponse(
    (response) =>
      /\/api\/posts\/\d+\/comments\/\d+\/users\/\d+$/.test(
        new URL(response.url()).pathname,
      ) && response.request().method() === "PATCH",
  );
  await dialog.getByRole("button", { name: "댓글 수정", exact: true }).click();
  expect((await responsePromise).status()).toBe(204);
  await expect(page.getByText(updatedComment)).toBeVisible();
  await expect(page.getByText(initialComment)).toHaveCount(0);

  await page.reload();
  await expect(page.getByText(updatedComment)).toBeVisible();
  await expect(page.getByText(initialComment)).toHaveCount(0);
  expect(consoleErrors).toEqual([]);
});
