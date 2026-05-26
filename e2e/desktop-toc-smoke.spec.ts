import { test, expect } from "@playwright/test";
import { gotoProductView } from "./smoke-helpers";

test.describe("Desktop Obsah (TOC)", () => {
  test.beforeEach(async ({ page }) => {
    await gotoProductView(page, "nv75");
  });

  test("panel Obsah lze skrýt a znovu zobrazit", async ({ page }) => {
    const nav = page.locator(".page-toc--rail");
    await expect(nav).toBeVisible();
    await expect(page.locator(".page-toc__toggle")).toBeVisible();

    await page.locator(".page-toc__toggle").click();
    await expect(nav).toHaveAttribute("aria-hidden", "true");
    await expect.poll(() => page.evaluate(() => localStorage.getItem("phmax-toc-open"))).toBe("0");
    await page.reload();
    await expect(nav).toHaveAttribute("aria-hidden", "true");

    const reopen = page.locator(".page-toc-mobile-trigger");
    await expect(reopen).toBeVisible();
    await expect(reopen).toHaveText("Obsah");
    await reopen.click();
    await expect(nav).toBeVisible();
  });
});
