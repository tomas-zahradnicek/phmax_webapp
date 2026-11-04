import { test, expect, type Locator } from "@playwright/test";
import { clearLocalStorageKeys, gotoProductView } from "./smoke-helpers";

const SUMMARY_VIEWPORTS = [
  { width: 390, height: 844 },
  { width: 768, height: 900 },
  { width: 1024, height: 800 },
] as const;

async function summaryObstructs(target: Locator): Promise<boolean> {
  return target.evaluate((el) => {
    const panel = document.querySelector(".calculator-mobile-scroll-results");
    if (!(panel instanceof HTMLElement)) return false;
    const style = getComputedStyle(panel);
    if (style.display === "none" || style.visibility === "hidden" || style.pointerEvents === "none") return false;
    const targetBox = el.getBoundingClientRect();
    const panelBox = panel.getBoundingClientRect();
    return (
      targetBox.width > 0 &&
      targetBox.height > 0 &&
      panelBox.height > 0 &&
      targetBox.bottom > panelBox.top &&
      targetBox.top < panelBox.bottom
    );
  });
}

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
    const wizardHeading = page.locator(".zs-basic-wizard .section-title");
    const firstInput = page.locator("#zs-mode-select");

    for (const viewport of SUMMARY_VIEWPORTS) {
      await page.setViewportSize(viewport);
      await page.evaluate(() => window.scrollTo(0, 0));
      await expect(results).toBeVisible();
      await expect(wizardHeading).toHaveText("Typ školy");
      await expect(wizardHeading).toBeInViewport();
      await expect(firstInput).toBeInViewport();
      await expect(displaySettings).toBeVisible();
      expect(await summaryObstructs(results)).toBe(false);
      expect(await summaryObstructs(wizardHeading)).toBe(false);
      expect(await summaryObstructs(firstInput)).toBe(false);

      const settingsReachable = await displaySettings.evaluate((el) => {
        const box = el.getBoundingClientRect();
        const x = Math.min(Math.max(box.left + box.width / 2, 1), window.innerWidth - 2);
        const y = Math.min(Math.max(box.top + box.height / 2, 1), window.innerHeight - 2);
        const top = document.elementFromPoint(x, y);
        return Boolean(top && (el === top || el.contains(top)));
      });
      expect(settingsReachable).toBe(true);

      const overflow = await page.evaluate(
        () => document.documentElement.scrollWidth > window.innerWidth + 1,
      );
      expect(overflow).toBe(false);
    }

    await page.setViewportSize({ width: 390, height: 844 });
    await page.evaluate(() => window.scrollTo(0, 0));
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
