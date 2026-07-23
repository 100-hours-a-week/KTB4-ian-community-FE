import { expect, test } from "@playwright/test";

test("실제 Backend에서 댓글을 삭제하고 새로고침 후 다시 조회한다", async ({
  page,
}) => {
  await page.addInitScript(() => {
    globalThis.__API_BASE_URL__ = "http://127.0.0.1:8081";
  });
  const suffix = `${Date.now()}`.slice(-9);
  const postContent = `댓글 삭제용 피드 ${suffix}`;
  const comment = `삭제할 댓글 ${suffix}`;
  await page.goto("/signup");
  await page.getByLabel("이메일").fill(`comment-delete-${suffix}@example.com`);
  await page.getByLabel("비밀번호", { exact: true }).fill("Signup123!");
  await page.getByLabel("비밀번호 확인").fill("Signup123!");
  await page.getByLabel("닉네임").fill(`댓삭${suffix.slice(-4)}`);
  await page.getByRole("button", { name: "회원가입", exact: true }).click();
  await page.getByRole("button", { name: "피드 게시하기" }).click();
  await page.getByLabel("피드 본문").fill(postContent);
  await page.getByRole("button", { name: "피드 게시", exact: true }).click();
  const card = page.locator(".post-card").filter({ hasText: postContent });
  await card.locator(".post-card__body").click();
  await page.getByLabel("댓글 작성").fill(comment);
  await page.getByRole("button", { name: "댓글 등록" }).click();
  const commentArticle = page
    .locator(".comments article")
    .filter({ hasText: comment });
  await expect(commentArticle).toBeVisible();
  await commentArticle
    .getByRole("button", { name: "댓글 옵션", exact: true })
    .click();
  await page.getByRole("menuitem", { name: "삭제하기", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "댓글 삭제 확인" });
  await expect(dialog).toBeVisible();
  const responsePromise = page.waitForResponse(
    (response) =>
      /\/api\/posts\/\d+\/comments\/\d+\/users\/\d+$/.test(
        new URL(response.url()).pathname,
      ) && response.request().method() === "DELETE",
  );
  await dialog.getByRole("button", { name: "확인" }).click();
  expect((await responsePromise).status()).toBe(204);
  await expect(page.getByText(comment)).toHaveCount(0);
  await page.reload();
  await expect(page.getByText(comment)).toHaveCount(0);
});
