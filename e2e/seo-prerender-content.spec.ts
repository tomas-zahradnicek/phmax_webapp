import { test, expect } from "@playwright/test";

const ZS_PATH = "/phmax-zakladni-skola/";
const ZS_H1 = "Kalkulačka PHmax, PHAmax a PHPmax pro základní školu";

test.describe("SEO prerender obsah – s JavaScriptem", () => {
  test("po mountu odstraní #seo-prerender-content a ponechá jeden H1", async ({ page }) => {
    const consoleErrors: string[] = [];
    page.on("console", (msg) => {
      if (msg.type() === "error") consoleErrors.push(msg.text());
    });

    await page.goto(ZS_PATH);
    await expect(page.getByRole("heading", { level: 1 })).toContainText("základní škol", { timeout: 15_000 });
    await expect(page.locator("#seo-prerender-content")).toHaveCount(0);
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator('[data-testid="phmax-module-seo"]')).toHaveCount(1);
    await expect(page.locator(".calculator-hero-shell").first()).toBeVisible();
    expect(consoleErrors, `console errors: ${consoleErrors.join("; ")}`).toEqual([]);
  });

  test("klientská navigace mezi moduly funguje", async ({ page }) => {
    await page.goto(ZS_PATH);
    await page.getByRole("link", { name: "PHmax ŠD" }).first().click();
    await expect(page).toHaveURL(/\/phmax-skolni-druzina\/?$/);
    await expect(page.locator("#seo-prerender-content")).toHaveCount(0);
    await expect(page.locator("h1")).toHaveCount(1);
  });
});

test.describe("SEO prerender obsah – bez JavaScriptu", () => {
  test.use({ javaScriptEnabled: false });

  test("zobrazí route-specific H1, FAQ a interní odkazy", async ({ page }) => {
    await page.goto(ZS_PATH);
    await expect(page.locator("#seo-prerender-content")).toHaveCount(1);
    await expect(page.getByRole("heading", { level: 1, name: ZS_H1 })).toBeVisible();
    await expect(page.getByText("Nejčastější otázky")).toBeVisible();
    await expect(page.getByRole("link", { name: "Návod k použití" })).toBeVisible();
    await expect(page.getByRole("link", { name: "Rychlý PHmax pro základní školu" })).toBeVisible();
    await expect(page.locator("h1")).toHaveCount(1);
    await expect(page.locator("main")).toHaveCount(1);
  });
});
