import { chromium } from "playwright";
import { mkdir } from "node:fs/promises";

const outputDirectory = process.argv[2] ?? "tests/visual/before";
const routePath = process.argv[3] ?? "/feed";

const user = {
  user_id: 7,
  email: "pulse@example.com",
  nickname: "PULSE 사용자",
  profile_image: "/images/me.svg",
};
const post = {
  post_id: 1,
  content: "Figma 기준 커뮤니티 피드",
  nickname: user.nickname,
  profile_image: user.profile_image,
  like_count: 3,
  comment_count: 0,
  comment: [],
};

const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  colorScheme: "light",
  locale: "ko-KR",
});
const page = await context.newPage();
await page.addInitScript(() => {
  sessionStorage.setItem("userId", "7");
  sessionStorage.setItem(
    "community.user",
    JSON.stringify({ userId: 7, nickname: "PULSE 사용자" }),
  );
});
await page.route("http://127.0.0.1:8080/**", async (requestRoute) => {
  const url = new URL(requestRoute.request().url());
  const headers = {
    "Access-Control-Allow-Origin": "http://127.0.0.1:4173",
    "Access-Control-Allow-Credentials": "true",
  };
  if (url.pathname.endsWith(".svg")) {
    return requestRoute.fulfill({
      status: 200,
      contentType: "image/svg+xml",
      body: '<svg xmlns="http://www.w3.org/2000/svg" width="34" height="34"><circle cx="17" cy="17" r="16" fill="#e5e5e5"/></svg>',
      headers,
    });
  }
  if (url.pathname === "/api/users/7") {
    return requestRoute.fulfill({ json: { data: user }, headers });
  }
  if (url.pathname === "/api/posts") {
    return requestRoute.fulfill({
      json: { data: { content: [post] } },
      headers,
    });
  }
  if (url.pathname === "/api/posts/1") {
    return requestRoute.fulfill({ json: { data: post }, headers });
  }
  return requestRoute.fulfill({ status: 204, headers });
});

await page.goto(`http://127.0.0.1:4173${routePath}`);
await page.locator(".lnb").waitFor({ state: "visible" });
await page.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all(
    [...document.images].map((element) => {
      if (element.complete) return undefined;
      return new Promise((resolve) => {
        element.addEventListener("load", resolve, { once: true });
        element.addEventListener("error", resolve, { once: true });
      });
    }),
  );
});
await mkdir(outputDirectory, { recursive: true });
const name = routePath === "/bookmarks" ? "bookmarks" : "feed";
await page.screenshot({
  path: `${outputDirectory}/${name}.png`,
  animations: "disabled",
});
await page.locator(".lnb").screenshot({
  path: `${outputDirectory}/lnb-${name}.png`,
  animations: "disabled",
});
await browser.close();
