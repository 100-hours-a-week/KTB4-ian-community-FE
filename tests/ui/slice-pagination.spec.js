test(
  "마지막 Feed Slice에서는 추가 Scroll 조회를 중단한다",
  async ({ page }) => {
    const state = await prepare(page);

    await page.goto("/feed");

    await expect(
      page.getByText("기존 마지막 피드"),
    ).toBeVisible();

    await scrollPastEnd(page);

    expect(state.feedRequests).toBe(1);

    await expect(
      page.getByRole("button", {
        name: "피드 더 보기",
      }),
    ).toHaveCount(0);
  },
);

test(
  "마지막 Bookmark Slice에서는 추가 Scroll 조회를 중단한다",
  async ({ page }) => {
    const state = await prepare(page);

    await page.goto("/bookmarks");

    await expect(
      page.getByText("기존 마지막 북마크"),
    ).toBeVisible();

    await scrollPastEnd(page);

    expect(state.bookmarkRequests).toBe(1);

    await expect(
      page.getByRole("button", {
        name: "북마크 더 보기",
      }),
    ).toHaveCount(0);
  },
);