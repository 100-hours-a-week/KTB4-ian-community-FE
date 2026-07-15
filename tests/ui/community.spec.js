import { expect, test } from "@playwright/test";

const browserErrors = new WeakMap();

const feed = {
  post_id: 1,
  content: "Figma 기준 커뮤니티 피드",
  nickname: "PULSE 사용자",
  created_at: new Date().toISOString(),
  like_count: 3,
  comment_count: 1,
  view_count: 12,
  image_url: null,
  comment: [],
};
test.beforeEach(async ({ page }) => {
  const errors = [];
  browserErrors.set(page, errors);
  page.on("pageerror", (error) => errors.push(error.message));
  page.on("console", (message) => {
    if (message.type() === "error") errors.push(message.text());
  });
  page.on("response", (response) => {
    if (
      response.status() === 404 &&
      new URL(response.url()).origin === "http://127.0.0.1:4173"
    )
      errors.push(`404 ${response.url()}`);
  });
  await page.addInitScript(() => {
    sessionStorage.setItem("userId", "7");
    sessionStorage.setItem(
      "community.user",
      JSON.stringify({
        userId: 7,
        email: "pulse@example.com",
        nickname: "PULSE 사용자",
      }),
    );
  });
});
test.afterEach(async ({ page }) => {
  expect(browserErrors.get(page)).toEqual([]);
});
async function mockApi(page) {
  await page.route("http://*/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/csrf")
      return route.fulfill({
        status: 200,
        headers: { "Set-Cookie": "XSRF-TOKEN=test; Path=/" },
      });
    if (url.pathname === "/api/posts")
      return route.fulfill({ json: { data: { content: [feed] } } });
    if (url.pathname === "/api/posts/1")
      return route.fulfill({ json: { data: feed } });
    return route.fulfill({ json: { data: {} } });
  });
}
test("피드 1920 레이아웃과 생성 모달", async ({ page }) => {
  await mockApi(page);
  await page.goto("/pages/posts/posts.html");
  await expect(page.getByText("Figma 기준 커뮤니티 피드")).toBeVisible();
  const content = await page.locator("main.page").boundingBox();
  const lnb = await page.locator("[data-app-lnb]").boundingBox();
  expect(content.width).toBeCloseTo(480, 0);
  expect(content.x + content.width / 2).toBeCloseTo(960, 0);
  expect(content.x - (lnb.x + lnb.width)).toBeCloseTo(40, 0);
  const author = await page.locator(".feed-card__author-main").boundingBox();
  const meta = await page.locator(".feed-card__meta").boundingBox();
  expect(meta.x).toBeGreaterThan(author.x + author.width);
  await page.getByRole("button", { name: "피드 게시하기" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  const dimmed = await page.locator("[data-create-modal]").boundingBox();
  expect(dimmed.x).toBe(0);
  expect(dimmed.width).toBe(1920);
  const camera = await page.locator(".feed-editor__camera").boundingBox();
  const submit = await page
    .getByRole("button", { name: "피드 게시", exact: true })
    .boundingBox();
  expect(camera.x).toBeLessThan(submit.x);
  expect(camera.width).toBe(32);
  expect(submit.width).toBe(32);
  await expect(page.locator("body")).toHaveClass(/is-modal-open/);
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await page.locator(".feed-card__author").click();
  await expect(page).toHaveURL(/post-detail\.html\?postId=1$/);
});
test("로그인은 화면을 정확히 절반으로 나눈다", async ({ page }) => {
  await mockApi(page);
  await page.goto("/pages/login/login.html");
  const art = await page.locator(".auth-artwork").boundingBox();
  const main = await page.locator(".auth-main").boundingBox();
  expect(art.width).toBeCloseTo(960, 0);
  expect(main.width).toBeCloseTo(960, 0);
  await expect(page.locator(".auth-panel")).toHaveCSS("width", "343px");
});
test("딤드는 모바일 뷰포트 전체를 덮는다", async ({ page }) => {
  await page.setViewportSize({ width: 390, height: 844 });
  await mockApi(page);
  await page.goto("/pages/posts/posts.html");
  await page.getByRole("button", { name: "피드 게시하기" }).click();
  const dimmed = await page.locator("[data-create-modal]").boundingBox();
  expect(dimmed).toMatchObject({ x: 0, y: 0, width: 390, height: 844 });
});
test("북마크는 같은 브라우저에서 유지되고 해제된다", async ({ page }) => {
  await mockApi(page);
  await page.goto("/pages/posts/posts.html");
  await page.getByRole("button", { name: "북마크" }).click();
  await page.goto("/pages/bookmarks/bookmarks.html");
  await expect(page.getByText("Figma 기준 커뮤니티 피드")).toBeVisible();
  await page.getByRole("button", { name: "북마크" }).click();
  await expect(page.getByText("아직 저장한 피드가 없어요")).toBeVisible();
});
test("상세 댓글 입력과 옵션 메뉴", async ({ page }) => {
  await mockApi(page);
  await page.goto("/pages/post-detail/post-detail.html?postId=1");
  await expect(page.getByText("Figma 기준 커뮤니티 피드")).toBeVisible();
  const input = page.getByLabel("댓글 작성");
  const detail = await page.locator("main.page").boundingBox();
  const composer = await page.locator("[data-comment-form]").boundingBox();
  expect(composer.x - detail.x).toBeGreaterThanOrEqual(15);
  expect(
    detail.x + detail.width - composer.x - composer.width,
  ).toBeGreaterThanOrEqual(15);
  await input.fill("댓글입니다");
  await expect(page.getByRole("button", { name: "댓글 등록" })).toBeEnabled();
  const postMore = await page
    .getByRole("button", { name: "피드 옵션" })
    .boundingBox();
  const back = await page
    .getByRole("button", { name: "피드 목록으로 돌아가기" })
    .boundingBox();
  expect(detail.x + detail.width - postMore.x - postMore.width).toBeCloseTo(
    back.x - detail.x,
    0,
  );
  await page.getByRole("button", { name: "피드 옵션" }).click();
  await expect(page.getByRole("menu")).toBeVisible();
  await page.getByRole("menuitem", { name: "수정하기" }).click();
  const editCamera = await page.locator(".feed-editor__camera").boundingBox();
  const editSubmit = await page
    .getByRole("button", { name: "피드 수정 완료" })
    .boundingBox();
  expect(editCamera.x).toBeLessThan(editSubmit.x);
  expect(editCamera.width).toBe(32);
  expect(editSubmit.width).toBe(32);
});
test("좋아요 상태는 목록과 상세에서 공유된다", async ({ page }) => {
  await mockApi(page);
  await page.goto("/pages/posts/posts.html");
  await page.getByRole("button", { name: "좋아요" }).click();
  await expect(page.getByRole("button", { name: "좋아요" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await page.locator(".feed-card__content").click();
  await expect(page.getByRole("button", { name: "좋아요" })).toHaveAttribute(
    "aria-pressed",
    "true",
  );
});
test("Access Token 만료 전에 자동 재발급하고 피드를 유지한다", async ({
  page,
}) => {
  await page.addInitScript(() => {
    sessionStorage.setItem(
      "community.accessIssuedAt",
      String(Date.now() - 10 * 60 * 1000),
    );
  });
  let refreshCount = 0;
  await page.route("http://*/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/csrf") {
      return route.fulfill({
        status: 200,
        headers: { "Set-Cookie": "XSRF-TOKEN=test; Path=/" },
      });
    }
    if (url.pathname === "/api/users/refresh") {
      refreshCount += 1;
      return route.fulfill({ status: 204 });
    }
    if (url.pathname === "/api/posts") {
      return route.fulfill({ json: { data: { content: [feed] } } });
    }
    return route.fulfill({ json: { data: {} } });
  });

  await page.goto("/pages/posts/posts.html");
  await expect(page.getByText("Figma 기준 커뮤니티 피드")).toBeVisible();
  expect(refreshCount).toBe(1);
  await expect(page).toHaveURL(/posts\/posts\.html$/);
});
test("프로필 이메일은 입력폼이 아니고 회원탈퇴는 중앙 정렬된다", async ({
  page,
}) => {
  await mockApi(page);
  await page.goto("/pages/posts/posts.html");
  await page.getByRole("button", { name: "프로필 편집" }).click();
  await expect(page.locator("[data-profile-email]")).toBeVisible();
  await expect(page.locator("[data-profile-email]")).toHaveText(
    "pulse@example.com",
  );
  await expect(page.getByLabel("닉네임")).toHaveValue("PULSE 사용자");
  const dialog = await page
    .locator("[data-profile-modal] .modal__dialog")
    .boundingBox();
  const title = await page.locator("#profile-modal-title").boundingBox();
  expect(title.x + title.width / 2).toBeCloseTo(dialog.x + dialog.width / 2, 0);
  await expect(page.locator("#profile-modal-title")).toHaveCSS(
    "font-size",
    "20px",
  );
  await expect(
    page.locator('[data-profile-form] input[type="email"]'),
  ).toHaveCount(0);
  await expect(page.locator(".profile-delete")).toHaveCSS(
    "justify-content",
    "center",
  );
  await expect(page.locator(".profile-delete")).toHaveCSS(
    "padding-bottom",
    "24px",
  );
  await page.keyboard.press("Escape");
  await page.getByRole("button", { name: "비밀번호 변경" }).click();
  const passwordDialog = await page
    .locator("[data-password-modal] .modal__dialog")
    .boundingBox();
  const passwordTitle = await page
    .locator("#password-modal-title")
    .boundingBox();
  expect(passwordTitle.x + passwordTitle.width / 2).toBeCloseTo(
    passwordDialog.x + passwordDialog.width / 2,
    0,
  );
  await expect(page.locator("#password-modal-title")).toHaveCSS(
    "font-size",
    "20px",
  );
});
test("댓글 입력과 수정 완료 버튼은 Figma 수치를 따른다", async ({ page }) => {
  const detailFeed = {
    ...feed,
    nickname: "다른 작성자",
    comment: [
      {
        comment_id: 7,
        user_id: 7,
        comment: "수정할 댓글",
        nickname: "댓글 작성자",
        profile_image: null,
      },
      {
        comment_id: 8,
        user_id: 99,
        comment: "다른 사람 댓글",
        nickname: "다른 사용자",
        profile_image: null,
      },
    ],
  };
  await page.route("http://*/api/**", async (route) => {
    const url = new URL(route.request().url());
    if (url.pathname === "/api/posts/1")
      return route.fulfill({ json: { data: detailFeed } });
    return route.fulfill({ json: { data: {} } });
  });
  await page.goto("/pages/post-detail/post-detail.html?postId=1");
  await expect(page.getByLabel("댓글 작성")).toHaveCSS("font-size", "12px");
  await expect(page.locator(".comment time")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "피드 옵션" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "댓글 옵션" })).toHaveCount(1);
  await page.getByRole("button", { name: "댓글 옵션" }).click();
  await page.getByRole("menuitem", { name: "수정하기" }).click();
  const submit = page.getByRole("button", { name: "댓글 수정 완료" });
  await expect(submit).toHaveCSS("width", "32px");
  await expect(submit).toHaveCSS("height", "32px");
  await expect(submit).toBeDisabled();
  await page.getByLabel("댓글 내용").fill("수정된 댓글");
  await expect(submit).toBeEnabled();
});
