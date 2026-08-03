import { expect, test } from "@playwright/test";

test("실제 Backend에서 Bookmark와 10개 Slice를 화면 전체 흐름으로 유지한다", async ({
  page,
}) => {
  test.setTimeout(60_000);
  await page.addInitScript(() => {
    globalThis.__API_BASE_URL__ = "http://127.0.0.1:8081";
  });
  const suffix = `${Date.now()}`.slice(-9);
  const nickname = `북마크${suffix.slice(-4)}`;
  const contentPrefix = `북마크 ${suffix} Slice 게시글`;

  await page.goto("/signup");
  await page.getByLabel("이메일").fill(`bookmark-${suffix}@example.com`);
  await page.getByLabel("비밀번호", { exact: true }).fill("Signup123!");
  await page.getByLabel("비밀번호 확인").fill("Signup123!");
  await page.getByLabel("닉네임").fill(nickname);
  await page.getByRole("button", { name: "회원가입", exact: true }).click();
  await expect(page).toHaveURL(/\/feed$/);

  for (let index = 0; index < 11; index += 1) {
    const content = `${contentPrefix} ${index}`;
    await page.getByRole("button", { name: "피드 게시하기" }).click();
    await page.getByLabel("피드 본문").fill(content);
    await page.getByRole("button", { name: "피드 게시", exact: true }).click();
    await expect(page.getByText(content, { exact: true })).toBeVisible();
  }

  await page.reload();
  const currentPosts = page
    .getByRole("article")
    .filter({ hasText: contentPrefix });
  await expect(currentPosts).toHaveCount(10);
  const more = page.getByRole("button", { name: "피드 더 보기" });
  if (await more.isVisible().catch(() => false)) await more.click();
  await expect(currentPosts).toHaveCount(11);

  const target = page.getByRole("article").filter({
    has: page.getByText(`${contentPrefix} 10`, { exact: true }),
  });
  await target.getByRole("button", { name: "피드 옵션" }).click();
  const saveResponse = page.waitForResponse(
    (response) =>
      /\/api\/posts\/\d+\/bookmarks$/.test(new URL(response.url()).pathname) &&
      response.request().method() === "POST",
  );
  await target.getByRole("menuitem", { name: "저장하기" }).click();
  expect((await saveResponse).status()).toBe(200);

  await page.reload();
  const restored = page.getByRole("article").filter({
    has: page.getByText(`${contentPrefix} 10`, { exact: true }),
  });
  await restored.getByRole("button", { name: "피드 옵션" }).click();
  await expect(
    restored.getByRole("menuitem", { name: "저장 취소" }),
  ).toBeVisible();
  await restored.getByRole("button", { name: "피드 옵션" }).click();

  await restored.getByText(`${contentPrefix} 10`).click();
  await expect(page).toHaveURL(/\/posts\/\d+$/);
  const detail = page.getByRole("article");
  await detail.getByRole("button", { name: "피드 옵션" }).click();
  await expect(
    detail.getByRole("menuitem", { name: "저장 취소" }),
  ).toBeVisible();

  await page.getByText("북마크", { exact: true }).click();
  await expect(page).toHaveURL(/\/bookmarks$/);
  await expect(page.getByText(`${contentPrefix} 10`)).toBeVisible();
  await page
    .getByRole("article")
    .getByRole("button", { name: "북마크" })
    .click();
  await expect(page.getByText("저장한 북마크가 없어요.")).toBeVisible();
});
