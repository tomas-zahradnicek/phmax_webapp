import { expect, test } from "@playwright/test";
import { gotoProductView } from "./smoke-helpers";

test.describe("ZŠ akce Přejít k chybě", () => {
  test("kompletní 934 h ponechá nápovědu a skryje skok k chybě", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem("phmax-calculator-hint-first-visit-v1", "1");
    });
    await page.setViewportSize({ width: 1366, height: 768 });
    await gotoProductView(page, "zs");
    await page.locator("#zs-hero-example-select").selectOption("priloha_uplna_zs_sec16");
    await expect(page.getByRole("list", { name: "Přehled výsledků" })).toContainText("934 h");
    await expect(page.getByRole("list", { name: "Přehled výsledků" })).toContainText("Nezadáno");

    const banner = page.locator(".calculator-input-issue-banner");
    await expect(banner.locator(".calculator-input-issue-banner__label")).toHaveText("Orientační nápověda k vyššímu pásmu");
    await expect(page.getByRole("list", { name: "Přehled výsledků" })).toContainText("Vstupy jsou kompletní");
    await expect(banner).toContainText("Vyšší pásmo");
    await expect(banner.getByRole("button", { name: "Přejít k chybě" })).toHaveCount(0);
    await expect(page.locator(".zs-basic-wizard").getByRole("button", { name: "Přejít k chybě" })).toHaveCount(0);
    await expect(page.locator(".calculator-workspace-dock").getByRole("button", { name: "Přejít k chybě" })).toHaveCount(0);
    await expect(page.getByRole("region", { name: "Další krok ve výpočtu" }).getByRole("button", { name: "Přejít k chybě" })).toHaveCount(0);

    await page.locator(".zs-basic-wizard").getByRole("button", { name: "Celkový přehled" }).click();
    await expect(page.locator(".zs-basic-wizard").getByRole("heading", { name: "Celkový přehled", exact: true })).toBeVisible();
    await expect(page.locator(".zs-basic-wizard").getByRole("button", { name: "Přejít k chybě" })).toHaveCount(0);
  });

  test("třídy bez žáků ponechají akci a běžný klik otevře sekci", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem("phmax-calculator-hint-first-visit-v1", "1");
    });
    await page.setViewportSize({ width: 1366, height: 768 });
    await gotoProductView(page, "zs");
    await page.getByRole("button", { name: "Další krok" }).click();
    await expect(page.getByRole("heading", { name: "Třídy", exact: true })).toBeVisible();
    const classes = page.locator('[data-section="basic"] input').nth(0);
    const pupils = page.locator('[data-section="basic"] input').nth(1);
    await classes.fill("2");
    await pupils.fill("0");
    await pupils.blur();

    const button = page.locator(".calculator-input-issue-banner__action");
    await expect(button).toBeVisible();
    await expect(button).toHaveAccessibleName("Přejít k chybě");
    await expect(page.locator(".calculator-input-issue-banner")).toContainText("chybí počet žáků");
    const section = page.locator('[data-section="basic"]');
    await page.evaluate(() => window.scrollTo(0, 0));
    const beforeTop = await section.evaluate((el) => el.getBoundingClientRect().top);
    await button.click();
    await expect.poll(async () => section.evaluate((el) => el.getBoundingClientRect().top)).toBeLessThan(beforeTop);
    await expect(section).toBeInViewport();
  });
});
