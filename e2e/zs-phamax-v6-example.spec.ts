import { expect, test, type Page } from "@playwright/test";
import { clearLocalStorageKeys, dismissMobileFloatingSummaryIfVisible, gotoProductView } from "./smoke-helpers";

const EXAMPLE_474 = "priloha_phamax_uplna_zs_sec16_zss";

async function loadExample(page: Page, example: string, label: RegExp) {
  await dismissMobileFloatingSummaryIfVisible(page);
  const control = page.locator("#zs-hero-example-select");
  await control.scrollIntoViewIfNeeded();
  const tag = await control.evaluate((el) => el.tagName);
  if (tag === "SELECT") {
    await control.selectOption(example);
    return;
  }
  await control.click();
  await page.locator(".hero-example-sheet__option").filter({ hasText: label }).click();
}

test.describe("ZŠ PHAmax příklad metodiky v6", () => {
  test.beforeEach(async ({ page }) => {
    await clearLocalStorageKeys(page, [
      "phmax-zs-basic-wizard-step",
      "phmax-zs-pha-basic-wizard-step",
      "phmax-zs-view-mode",
      "edu-cz-zs-calculator-state",
    ]);
    await gotoProductView(page, "zs");
  });

  test("oficiální příklad zobrazí záložku PHAmax, součet 474 h a mezisoučty", async ({ page }) => {
    await page.setViewportSize({ width: 1366, height: 900 });
    await loadExample(page, EXAMPLE_474, /474 h/);

    const phaTab = page.locator("button.tab.tab--strong", { hasText: "PHAmax" });
    await expect(phaTab).toHaveClass(/\bactive\b/);
    await expect(
      page.getByRole("navigation", { name: "Průběh záložek ZŠ" }).getByRole("button", { name: "PHAmax" }),
    ).toHaveAttribute("aria-current", "step");

    const anchor = page.getByRole("complementary", { name: "Hlavní výsledek výpočtu" });
    await expect(anchor.locator(".result-anchor-card__primary-label")).toHaveText("PHAmax celkem");
    await expect(anchor.locator(".result-anchor-card__primary-value")).toHaveText("474");

    const section = page.locator('[data-section="pha"]');
    await expect(section).toBeVisible();
    await expect(
      section.locator(".result-card").filter({ hasText: "PHAmax – asistenti pedagoga celkem" }).locator(".result-card__value"),
    ).toHaveText("474");

    await expect(section.locator("tbody tr td:nth-child(7)")).toHaveText(["48", "48", "93", "69", "174", "42"]);
  });
});
