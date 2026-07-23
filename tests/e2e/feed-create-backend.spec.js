import { expect, test } from "@playwright/test";

test("실제 Backend에서 피드를 생성하고 새로고침 후 다시 조회한다", async ({
  page,
}) => {
  await page.addInitScript(() => {
    globalThis.__API_BASE_URL__ = "http://127.0.0.1:8081";
  });
  const suffix = `${Date.now()}`.slice(-9);
  const nickname = `작성${suffix.slice(-4)}`;
  const content = `실제 Backend 피드 ${suffix}`;
  const consoleErrors = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });

  await page.goto("/signup");
  await page.getByLabel("이메일").fill(`feed-${suffix}@example.com`);
  await page.getByLabel("비밀번호", { exact: true }).fill("Signup123!");
  await page.getByLabel("비밀번호 확인").fill("Signup123!");
  await page.getByLabel("닉네임").fill(nickname);
  await page.getByRole("button", { name: "회원가입", exact: true }).click();
  await expect(page).toHaveURL(/\/feed$/);

  await page.getByRole("button", { name: "피드 게시하기" }).click();
  await page.getByLabel("피드 본문").fill(content);
  await page
    .locator('.feed-create-modal input[type="file"]')
    .setInputFiles("tests/fixtures/feed-create-reference.jpg");
  const responsePromise = page.waitForResponse(
    (response) =>
      /\/api\/posts\/\d+$/.test(new URL(response.url()).pathname) &&
      response.request().method() === "POST",
  );
  await page.getByRole("button", { name: "피드 게시", exact: true }).click();
  expect((await responsePromise).status()).toBe(201);
  await expect(page.getByText(content)).toBeVisible();

  await page.reload();
  await expect(page.getByText(content)).toBeVisible();
  const createdCard = page.locator(".post-card").filter({ hasText: content });
  const feedImage = createdCard.getByAltText("피드 첨부 이미지");
  await expect(feedImage).toBeVisible();
  await expect(feedImage).toHaveAttribute("draggable", "false");
  expect(
    await feedImage.evaluate((element) => {
      const event = new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
      });
      element.dispatchEvent(event);
      return {
        defaultPrevented: event.defaultPrevented,
        userSelect: getComputedStyle(element).userSelect,
      };
    }),
  ).toEqual({ defaultPrevented: true, userSelect: "none" });
  expect(
    await createdCard
      .locator(".post-card__content")
      .evaluate((element) => getComputedStyle(element).userSelect),
  ).not.toBe("none");
  await feedImage.click();
  await expect(page).toHaveURL(/\/posts\/\d+$/);
  const detailImage = page.getByAltText("피드 첨부 이미지");
  await expect(detailImage).toHaveAttribute("draggable", "false");
  expect(consoleErrors).toEqual([]);
});
