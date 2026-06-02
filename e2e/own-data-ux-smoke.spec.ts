import { test, expect } from "@playwright/test";
import { clearLocalStorageKeys, gotoProductView } from "./smoke-helpers";

test.describe("UX: vlastní údaje a režimy", () => {
  test("PV – nápověda vlastních údajů a vysvětlení režimu", async ({ page }) => {
    await gotoProductView(page, "pv");
    await expect(page.locator(".own-data-hint--hero").first()).toBeVisible();
    await expect(page.locator(".calculator-hero-display-controls--compact")).toBeVisible();
    await expect(page.getByRole("radio", { name: "Základní" })).toBeVisible();
    await expect(page.getByRole("radio", { name: "Expertní" })).toBeVisible();
    const viewHint = page.getByRole("button", { name: "Vysvětlení režimu práce" });
    await viewHint.click();
    await expect(page.locator(".calculator-hint-tooltip__bubble").first()).toContainText(/průvodce krok za krokem/i);
    await expect(page.getByRole("button", { name: "Začít od prázdného formuláře" })).toBeVisible();
  });

  test("Dashboard – dvě cesty pro nového uživatele", async ({ page }) => {
    await clearLocalStorageKeys(page, ["phmax-dash-last-active-product"]);
    await page.goto("/?view=dash");
    const card = page.locator(".dash-new-user-card");
    await expect(card).toBeVisible();
    await expect(card.getByRole("button", { name: /s ukázkou/i }).first()).toBeVisible();
    await expect(card.getByRole("button", { name: /vlastní data/i }).first()).toBeVisible();
  });

  test("PV – badge v docku podle vašich vstupů", async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 900 });
    await gotoProductView(page, "pv");
    await expect(page.locator(".result-anchor-card__input-badge")).toContainText("Podle vašich vstupů");
  });
});
