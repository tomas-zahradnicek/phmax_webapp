import { test, expect } from "@playwright/test";
import { clearLocalStorageKeys, gotoProductView } from "./smoke-helpers";

test.describe("ZŠ mobilní smoke", () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalStorageKeys(page, [
      "phmax-zs-basic-wizard-step",
      "phmax-zs-view-mode",
      "edu-cz-zs-calculator-state",
    ]);
    await gotoProductView(page, "zs");
  });

  test("banner neúplných vstupů a Přejít k chybě", async ({ page }) => {
    const issueBanner = page.locator(".calculator-input-issue-banner");
    await expect(issueBanner).toBeVisible();
    await expect(issueBanner).toContainText(/kompletní|vyplňte|PHmax/i);
    await expect(page.getByRole("button", { name: "Přejít k chybě" }).first()).toBeVisible();
  });

  test("plovoucí souhrn nezasahuje do hero a po odscrollování jde skrýt i znovu otevřít", async ({ page }) => {
    const floatingSummary = page.locator(".calculator-mobile-scroll-results");
    const results = page.getByRole("list", { name: "Přehled výsledků" });
    const displaySettings = page.getByRole("button", { name: /Zobrazení/ });
    await expect(results).toBeVisible();
    await expect(displaySettings).toBeVisible();

    const coveredAtTop = await results.evaluate((list) => {
      const panel = document.querySelector(".calculator-mobile-scroll-results");
      if (!(panel instanceof HTMLElement)) return false;
      const style = getComputedStyle(panel);
      if (style.display === "none" || style.visibility === "hidden" || style.pointerEvents === "none") return false;
      const resultsBox = list.getBoundingClientRect();
      const panelBox = panel.getBoundingClientRect();
      return resultsBox.bottom > panelBox.top && resultsBox.top < panelBox.bottom && panelBox.height > 0;
    });
    expect(coveredAtTop).toBe(false);
    await expect(floatingSummary).toBeHidden();

    const settingsReachable = await displaySettings.evaluate((el) => {
      const box = el.getBoundingClientRect();
      const x = Math.min(Math.max(box.left + box.width / 2, 1), window.innerWidth - 2);
      const y = Math.min(Math.max(box.top + box.height / 2, 1), window.innerHeight - 2);
      const top = document.elementFromPoint(x, y);
      return Boolean(top && (el === top || el.contains(top)));
    });
    expect(settingsReachable).toBe(true);

    await page.evaluate(() => {
      const hero = document.querySelector(".calculator-hero-shell");
      const bottom = hero instanceof HTMLElement ? hero.getBoundingClientRect().bottom : window.innerHeight;
      window.scrollTo(0, window.scrollY + bottom + 24);
    });
    await expect(floatingSummary).toBeVisible();

    await floatingSummary.getByRole("button", { name: "Skrýt souhrn výsledků" }).click();
    const showChip = page.locator(".calculator-mobile-summary-chip");
    await expect(showChip).toBeVisible();
    await expect(floatingSummary).toHaveCount(0);
    await expect(showChip).toHaveAttribute("aria-label", "Zobrazit souhrn výsledků");

    await showChip.click();
    await expect(floatingSummary).toBeVisible();
  });

  test("průvodce krok Třídy a Přejít k chybě", async ({ page }) => {
    await page.getByRole("button", { name: "2 Třídy" }).click({ force: true });
    await page.getByRole("button", { name: "Přejít k chybě" }).first().click();
    await expect(page.locator('[data-section="basic"]')).toBeVisible();
  });
});
