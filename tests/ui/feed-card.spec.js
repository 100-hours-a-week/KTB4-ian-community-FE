import { expect, test } from "@playwright/test";
import { fileURLToPath } from "node:url";

const landscapePath = fileURLToPath(
  new URL("../fixtures/feed-figma-image-1.jpeg", import.meta.url),
);
const portraitPath = fileURLToPath(
  new URL("../fixtures/feed-figma-avatar-2.jpeg", import.meta.url),
);

const cors = {
  "Access-Control-Allow-Origin": "http://127.0.0.1:4173",
  "Access-Control-Allow-Credentials": "true",
  "Access-Control-Allow-Headers": "Content-Type, X-XSRF-TOKEN",
  "Access-Control-Allow-Methods": "GET, POST, PATCH, DELETE, OPTIONS",
};

async function prepare(page) {
  const consoleErrors = [];
  const failedAssets = [];
  page.on("console", (message) => {
    if (message.type() === "error") consoleErrors.push(message.text());
  });
  page.on("response", (response) => {
    if (
      response.status() >= 400 &&
      /\.(?:svg|png|jpe?g|webp)(?:\?|$)/i.test(response.url())
    )
      failedAssets.push(`${response.status()} ${response.url()}`);
  });
  await page.addInitScript(() => {
    sessionStorage.setItem("userId", "7");
    sessionStorage.setItem(
      "community.user",
      JSON.stringify({ userId: 7, nickname: "현재 사용자" }),
    );
  });
  await page.route("http://127.0.0.1:8080/**", async (route) => {
    const url = new URL(route.request().url());
    const method = route.request().method();
    if (method === "OPTIONS")
      return route.fulfill({ status: 204, headers: cors });
    if (url.pathname === "/api/csrf")
      return route.fulfill({
        status: 200,
        headers: { ...cors, "Set-Cookie": "XSRF-TOKEN=test; Path=/" },
      });
    if (url.pathname === "/api/users/7")
      return route.fulfill({
        json: {
          data: {
            user_id: 7,
            nickname: "현재 사용자",
            profile_image: "/images/me.svg",
          },
        },
        headers: cors,
      });
    if (url.pathname === "/api/posts")
      return route.fulfill({
        json: {
          data: {
            content: [
              {
                post_id: 1,
                content:
                  "분위기 좋은 다로베에서 화덕피자 먹고, 도보 5분 거리 재즈바 '포지티브 제로'로 이동하세요.\n조명이 예뻐서 서로 더 예뻐 보이는 마법의 코스입니다. (예약 필수!)",
                nickname: "dlkfjls",
                profile_image: "/images/author.svg",
                image_url: "/images/feed-landscape.jpeg",
                view_count: 12_345,
                like_count: 12_345,
                comment_count: 1_240,
                created_at: new Date().toISOString(),
              },
              {
                post_id: 2,
                content: "두 번째 피드",
                nickname: "dlkfjls",
                profile_image: "/images/author.svg",
                image_url: "/images/feed-portrait.jpeg",
                view_count: 342,
                like_count: 0,
                comment_count: 0,
                created_at: new Date(Date.now() - 86_400_000).toISOString(),
              },
            ],
          },
        },
        headers: cors,
      });
    if (url.pathname === "/images/feed-landscape.jpeg")
      return route.fulfill({
        status: 200,
        contentType: "image/jpeg",
        path: landscapePath,
        headers: cors,
      });
    if (url.pathname === "/images/feed-portrait.jpeg")
      return route.fulfill({
        status: 200,
        contentType: "image/jpeg",
        path: portraitPath,
        headers: cors,
      });
    if (url.pathname.endsWith(".svg"))
      return route.fulfill({
        status: 200,
        contentType: "image/svg+xml",
        body: '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34" viewBox="0 0 34 34"><circle cx="17" cy="17" r="16.25" fill="white" stroke="#e5e5e5" stroke-width="1.5"/><circle cx="17" cy="12" r="4" fill="#a1a1a1"/><path d="M9 26v-3c0-4 3-7 8-7s8 3 8 7v3" fill="#a1a1a1"/></svg>',
        headers: cors,
      });
    return route.fulfill({ status: 204, headers: cors });
  });
  return { consoleErrors, failedAssets };
}

async function waitForStableFeed(page) {
  await expect(page.getByText(/분위기 좋은 다로베에서 화덕피자/)).toBeVisible();
  await page.evaluate(async () => {
    await document.fonts.ready;
    await Promise.all(
      [...document.images].map((image) => {
        if (image.complete) return undefined;
        return new Promise((resolve) => {
          image.addEventListener("load", resolve, { once: true });
          image.addEventListener("error", resolve, { once: true });
        });
      }),
    );
  });
}

test("Feed Card는 Figma 크기·간격·타이포그래피를 사용한다", async ({
  page,
}) => {
  const network = await prepare(page);
  await page.goto("/feed");
  await waitForStableFeed(page);
  const metrics = await page.evaluate(() => {
    const measure = (selector) => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return { x: rect.x, width: rect.width, height: rect.height };
    };
    const card = document.querySelector(".post-card");
    const content = document.querySelector(".post-card__content");
    const metadata = document.querySelector(".post-card__metadata");
    return {
      card: measure(".post-card"),
      image: measure(".post-card__image"),
      avatar: measure(".post-card .user-avatar"),
      borderTop: getComputedStyle(card).borderTop,
      radius: getComputedStyle(card).borderRadius,
      contentTypography: {
        fontSize: getComputedStyle(content).fontSize,
        fontWeight: getComputedStyle(content).fontWeight,
        lineHeight: getComputedStyle(content).lineHeight,
      },
      metadataColor: getComputedStyle(metadata).color,
    };
  });
  expect(metrics.card).toMatchObject({ x: 720, width: 480 });
  expect(metrics.image).toMatchObject({ x: 736, width: 448, height: 288 });
  expect(metrics.avatar).toMatchObject({ width: 34, height: 34 });
  expect(metrics.borderTop).toBe("1px solid rgb(229, 229, 229)");
  expect(metrics.radius).toBe("0px");
  expect(metrics.contentTypography).toEqual({
    fontSize: "12px",
    fontWeight: "400",
    lineHeight: "18px",
  });
  expect(metrics.metadataColor).toBe("rgb(161, 161, 161)");
  expect(network.consoleErrors).toEqual([]);
  expect(network.failedAssets).toEqual([]);
  await page.screenshot({
    path: "tests/visual/after/feed-card.png",
    animations: "disabled",
  });
});

test("Feed Page는 Figma 1920×1080 Layout과 작성 진입 영역을 사용한다", async ({
  page,
}) => {
  const network = await prepare(page);
  await page.goto("/feed");
  await waitForStableFeed(page);
  await expect(page.getByRole("heading", { name: "피드" })).toBeVisible();
  const metrics = await page.evaluate(() => {
    const measure = (selector) => {
      const rect = document.querySelector(selector).getBoundingClientRect();
      return {
        x: rect.x,
        y: rect.y,
        width: rect.width,
        height: rect.height,
      };
    };
    const pageElement = document.querySelector(".feed-page");
    const heading = document.querySelector(".feed-page__intro h1");
    return {
      page: measure(".feed-page"),
      heading: measure(".feed-page__intro h1"),
      trigger: measure(".create-trigger"),
      publish: measure(".create-trigger b"),
      radius: getComputedStyle(pageElement).borderRadius,
      headingFont: {
        fontSize: getComputedStyle(heading).fontSize,
        fontWeight: getComputedStyle(heading).fontWeight,
        lineHeight: getComputedStyle(heading).lineHeight,
      },
    };
  });
  expect(metrics.page).toMatchObject({ x: 720, y: 40, width: 480 });
  expect(metrics.heading).toMatchObject({ x: 736, y: 60, height: 28 });
  expect(metrics.trigger).toMatchObject({
    x: 736,
    y: 112,
    width: 448,
    height: 34,
  });
  expect(metrics.publish.height).toBe(34);
  expect(metrics.radius).toBe("30px 30px 0px 0px");
  expect(metrics.headingFont).toEqual({
    fontSize: "20px",
    fontWeight: "700",
    lineHeight: "28px",
  });
  expect(network.consoleErrors).toEqual([]);
  expect(network.failedAssets).toEqual([]);
  await page.screenshot({
    path: "tests/visual/after/feed.png",
    animations: "disabled",
  });
});

test("Feed 이미지는 drag만 막고 본문과 클릭 동작은 유지한다", async ({
  page,
}) => {
  await prepare(page);
  await page.goto("/feed");
  await waitForStableFeed(page);
  const image = page.locator(".post-card__image").first();
  await expect(image).toHaveAttribute("draggable", "false");
  expect(
    await image.evaluate((element) => {
      const event = new DragEvent("dragstart", {
        bubbles: true,
        cancelable: true,
      });
      const dispatched = element.dispatchEvent(event);
      return { dispatched, defaultPrevented: event.defaultPrevented };
    }),
  ).toEqual({ dispatched: false, defaultPrevented: true });
  expect(
    await image.evaluate((element) => getComputedStyle(element).userSelect),
  ).toBe("none");
  expect(
    await page
      .locator(".post-card__content")
      .first()
      .evaluate((element) => getComputedStyle(element).userSelect),
  ).not.toBe("none");
  await image.click();
  await expect(page).toHaveURL(/\/posts\/1$/);
});
