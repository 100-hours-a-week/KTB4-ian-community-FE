import { expect, test } from "@playwright/test";

const user = {
  user_id: 7,
  email: "slice@example.com",
  nickname: "Slice 사용자",
  profile_image: "/images/profile.svg",
};

function post(postId, content, createdAt) {
  return {
    post_id: postId,
    user_id: 7,
    content,
    nickname: user.nickname,
    profile_image: user.profile_image,
    like_count: 0,
    comment_count: 0,
    view_count: 0,
    created_at: createdAt,
    bookmarked: true,
    comment: [],
  };
}

async function prepare(page, { empty = false } = {}) {
  const state = { feedRequests: 0, bookmarkRequests: 0 };
  const headers = {
    "Access-Control-Allow-Origin": "http://127.0.0.1:4173",
    "Access-Control-Allow-Credentials": "true",
    "Access-Control-Allow-Headers": "Content-Type, X-XSRF-TOKEN",
    "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
  };
  const first = Array.from({ length: 10 }, (_, index) =>
    post(
      11 - index,
      `피드 ${11 - index}`,
      index < 2 ? "2026-07-29T10:00:00Z" : `2026-07-29T0${9 - index}:00:00Z`,
    ),
  );
  const last = [post(1, "피드 1", "2026-07-28T23:00:00Z")];

  await page.addInitScript(() => {
    sessionStorage.setItem("userId", "7");
    sessionStorage.setItem(
      "community.user",
      JSON.stringify({ userId: 7, nickname: "Slice 사용자" }),
    );
  });

  await page.route("http://127.0.0.1:8080/**", async (route) => {
    const request = route.request();
    const url = new URL(request.url());
    if (request.method() === "OPTIONS")
      return route.fulfill({ status: 204, headers });
    if (url.pathname === "/api/users/me")
      return route.fulfill({ json: { data: user }, headers });
    if (url.pathname.endsWith(".svg"))
      return route.fulfill({
        status: 200,
        contentType: "image/svg+xml",
        body: "<svg xmlns='http://www.w3.org/2000/svg'/>",
        headers,
      });

    const pageNumber = Number(url.searchParams.get("page") || 0);
    const isBookmarks = url.pathname === "/api/posts/bookmarks";
    if (
      request.method() === "GET" &&
      (url.pathname === "/api/posts" || isBookmarks)
    ) {
      if (isBookmarks) state.bookmarkRequests += 1;
      else state.feedRequests += 1;
      const content = empty ? [] : pageNumber === 0 ? first : last;
      const hasNext = !empty && pageNumber === 0;
      return route.fulfill({
        json: {
          data: {
            content,
            page: pageNumber,
            size: 10,
            hasNext,
            message: hasNext
              ? null
              : isBookmarks
                ? "더 이상 조회할 북마크가 없습니다."
                : "더 이상 조회할 피드가 없습니다.",
          },
        },
        headers,
      });
    }
    return route.fulfill({ status: 204, headers });
  });

  return state;
}

async function finishSlice(page, lastText, moreButtonName) {
  await expect(page.getByText("피드 11", { exact: true })).toBeVisible();
  await expect(page.getByText("피드 2", { exact: true })).toBeVisible();
  await page
    .getByRole("button", { name: moreButtonName })
    .scrollIntoViewIfNeeded();
  await expect(page.getByText("피드 1", { exact: true })).toBeVisible();
  if (lastText) {
    await expect(page.getByText(lastText)).toHaveCount(1);
    await expect(page.getByText(lastText)).toHaveAttribute(
      "aria-live",
      "polite",
    );
  }
}

test("11개 Feed Slice를 병합하고 종료 뒤 Scroll·visibility 재조회를 막는다", async ({
  page,
}) => {
  const state = await prepare(page);
  await page.goto("/feed");
  await finishSlice(page, null, "피드 더 보기");
  await expect(page.getByText("더 이상 조회할 피드가 없습니다.")).toHaveCount(
    0,
  );

  expect(state.feedRequests).toBe(2);
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
    document.dispatchEvent(new Event("visibilitychange"));
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(100);
  expect(state.feedRequests).toBe(2);
  await expect(page.locator(".post-card")).toHaveCount(11);
});

test("11개 Bookmark Slice를 병합하고 종료 뒤 Scroll·visibility 재조회를 막는다", async ({
  page,
}) => {
  const state = await prepare(page);
  await page.goto("/bookmarks");
  await finishSlice(
    page,
    "더 이상 조회할 북마크가 없습니다.",
    "북마크 더 보기",
  );

  expect(state.bookmarkRequests).toBe(2);
  await page.evaluate(() => {
    window.scrollTo(0, document.body.scrollHeight);
    document.dispatchEvent(new Event("visibilitychange"));
  });
  await page.waitForTimeout(100);
  expect(state.bookmarkRequests).toBe(2);
  await expect(page.locator(".post-card")).toHaveCount(11);
});

test("빈 Feed와 빈 Bookmark 메시지는 Slice 종료 메시지와 구분한다", async ({
  page,
}) => {
  await prepare(page, { empty: true });
  await page.goto("/feed");
  await expect(page.getByText("아직 생성된 피드가 없어요.")).toBeVisible();
  await expect(page.getByText("더 이상 조회할 피드가 없습니다.")).toHaveCount(
    0,
  );

  await page.goto("/bookmarks");
  await expect(page.getByText("저장한 북마크가 없어요.")).toBeVisible();
  await expect(page.getByText("더 이상 조회할 북마크가 없습니다.")).toHaveCount(
    0,
  );
});
