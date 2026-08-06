import { expect, test as base } from "@playwright/test";

const apiBaseURL = process.env.E2E_API_BASE_URL ?? "http://127.0.0.1:8081";

export const test = base.extend({
  page: async ({ page }, use) => {
    await page.addInitScript((value) => {
      globalThis.__API_BASE_URL__ = value;
    }, apiBaseURL);
    await use(page);
  },
});

export { expect };
