import { chromium } from "@playwright/test";

const output = process.argv[2];
if (!output) throw new Error("Screenshot output path is required.");

const browser = await chromium.launch();
const context = await browser.newContext({
  viewport: { width: 1920, height: 1080 },
  deviceScaleFactor: 1,
  colorScheme: "light",
  locale: "ko-KR",
  reducedMotion: "reduce",
});
const page = await context.newPage();
const consoleErrors = [];
const failedAssets = [];
page.on("console", (message) => {
  if (message.type() === "error") consoleErrors.push(message.text());
});
page.on("response", (response) => {
  if (
    response.status() >= 400 &&
    /\.(png|svg|jpg|jpeg|webp|woff2)(\?|$)/.test(response.url())
  )
    failedAssets.push(`${response.status()} ${response.url()}`);
});

await page.goto("http://127.0.0.1:4173/login");
await page.evaluate(async () => {
  await document.fonts.ready;
  await Promise.all(
    [...document.images].map((image) =>
      image.complete
        ? undefined
        : new Promise((resolve) => {
            image.addEventListener("load", resolve, { once: true });
            image.addEventListener("error", resolve, { once: true });
          }),
    ),
  );
});
await page.locator(".auth-panel").waitFor({ state: "visible" });
await page.screenshot({ path: output, fullPage: true, animations: "disabled" });
await browser.close();

if (consoleErrors.length)
  throw new Error(`Console errors: ${consoleErrors.join(" | ")}`);
if (failedAssets.length)
  throw new Error(`Failed assets: ${failedAssets.join(" | ")}`);
