import { expect, test } from "@playwright/test";
import { gotoProductView } from "./smoke-helpers";

const HINT_HEADING = "Orientační nápověda k vyššímu pásmu";

test.describe("ZŠ nadpis banneru nápovědy pásma", () => {
  test("934 h popisuje nápovědu a ponechá dokončení jinde", async ({ page }) => {
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
    await expect(banner.locator(".calculator-input-issue-banner__label")).toHaveText(HINT_HEADING);
    await expect(banner).toContainText("Vyšší pásmo");
    await expect(banner.getByRole("button", { name: "Přejít k chybě" })).toHaveCount(0);
    await expect(page.getByText("Vstupy jsou kompletní").first()).toBeVisible();
    await expect(page.locator(".calculator-next-action")).toContainText("Vstupy jsou v pořádku");
    await expect(page.locator(".calculator-next-action").getByRole("button", { name: "Export" })).toBeVisible();

    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
    await expect(page.locator(".calculator-sticky-context")).toContainText("Vstupy jsou kompletní");
    await expect(page.locator(".calculator-sticky-context").getByRole("button", { name: "Uložit" })).toBeVisible();
    await expect(page.locator(".calculator-sticky-context").getByRole("button", { name: "Export" })).toBeVisible();
    await expect(page.locator(".result-anchor-card__status").first()).toHaveText("Vstupy jsou kompletní");
  });

  test("jen 1. stupeň ukáže text jedné nápovědy", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem("phmax-calculator-hint-first-visit-v1", "1");
    });
    await page.setViewportSize({ width: 1366, height: 768 });
    await gotoProductView(page, "zs");
    await page.getByRole("button", { name: "Další krok" }).click();
    const classes = page.locator('[data-section="basic"] input').nth(0);
    const pupils = page.locator('[data-section="basic"] input').nth(1);
    await classes.fill("10");
    await pupils.fill("200");
    await pupils.blur();

    const banner = page.locator(".calculator-input-issue-banner");
    await expect(banner.locator(".calculator-input-issue-banner__label")).toHaveText(HINT_HEADING);
    await expect(banner).toContainText("Základní škola – 1. stupeň");
    await expect(banner).toContainText("Vyšší pásmo");
    await expect(banner).not.toContainText("připravený pro export");
    await expect(banner.getByRole("button", { name: "Přejít k chybě" })).toHaveCount(0);
  });

  test("třídy bez žáků ponechají validační nadpis a běžný klik", async ({ page }) => {
    await page.addInitScript(() => {
      localStorage.clear();
      localStorage.setItem("phmax-calculator-hint-first-visit-v1", "1");
    });
    await page.setViewportSize({ width: 1366, height: 768 });
    await gotoProductView(page, "zs");
    await page.getByRole("button", { name: "Další krok" }).click();
    const classes = page.locator('[data-section="basic"] input').nth(0);
    const pupils = page.locator('[data-section="basic"] input').nth(1);
    await classes.fill("2");
    await pupils.fill("0");
    await pupils.blur();

    const banner = page.locator(".calculator-input-issue-banner");
    await expect(banner.locator(".calculator-input-issue-banner__label")).toHaveText("Na hraně: zadání ještě není kompletní");
    await expect(banner).toContainText("chybí počet žáků");
    const button = page.locator(".calculator-input-issue-banner__action");
    await expect(button).toHaveAccessibleName("Přejít k chybě");
    const section = page.locator('[data-section="basic"]');
    await page.evaluate(() => window.scrollTo(0, 0));
    const beforeTop = await section.evaluate((el) => el.getBoundingClientRect().top);
    await button.click();
    await expect.poll(async () => section.evaluate((el) => el.getBoundingClientRect().top)).toBeLessThan(beforeTop);
    await expect(section).toBeInViewport();
  });
});
